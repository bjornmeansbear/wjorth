import type { PageServerLoad } from './$types';
import { loadState } from '$lib/server/store';
import { filterByPeriod, type PeriodKey } from '$lib/finance/period';
import { tagRollup, filterByTag } from '$lib/finance/tags';
import { detectRecurring } from '$lib/finance/recurring';
import { effectiveTag } from '$lib/finance/tags';

export const load: PageServerLoad = async ({ url }) => {
	const state = await loadState();
	const period = (url.searchParams.get('period') ?? 'all') as PeriodKey;
	const filtered = filterByPeriod(state.transactions, period);

	const rollup = tagRollup(filtered, state.categoryTags);
	const wasteful = filterByTag(filtered, 'wasteful', state.categoryTags).sort((a, b) => b.amount - a.amount);
	const discretionary = filterByTag(filtered, 'discretionary', state.categoryTags).sort((a, b) => b.amount - a.amount);

	// The highest-value view: recurring charges (full history, per v1) whose
	// effective tag is discretionary/wasteful, sorted by annualized cost —
	// the direct answer to "what's recurring and pointless."
	const recurringWaste = detectRecurring(state.transactions)
		.filter((g) => {
			const tag = effectiveTag(g.transactions[0], state.categoryTags);
			return tag === 'discretionary' || tag === 'wasteful';
		})
		.sort((a, b) => b.annual - a.annual);

	// Real category stays visible here on purpose — this is a flag alongside
	// category, not a replacement bucket, so a car purchase still reads as
	// Transport, just marked as one-time rather than a recurring cost.
	const majorPurchases = filtered
		.filter((t) => t.isMajorPurchase)
		.sort((a, b) => b.amount - a.amount);
	const majorPurchasesTotal = majorPurchases.reduce((sum, t) => sum + t.amount, 0);

	// Interest + Fees: the real, avoidable cost of carrying a card balance.
	// Broken out per account within the selected period (so you know which
	// card to call first), plus a trend over the last 6 calendar months of
	// full history (ignoring the period filter, like recurringWaste below)
	// since the trend itself — is it getting worse? — is the point.
	const ccByAccount = new Map<string, { interest: number; fees: number }>();
	for (const t of filtered) {
		if (t.flow !== 'out') continue;
		if (t.category !== 'Interest' && t.category !== 'Fees') continue;
		const entry = ccByAccount.get(t.account) ?? { interest: 0, fees: 0 };
		if (t.category === 'Interest') entry.interest += t.amount;
		else entry.fees += t.amount;
		ccByAccount.set(t.account, entry);
	}
	const ccCostsByAccount = Array.from(ccByAccount, ([account, v]) => ({
		account,
		...v,
		total: v.interest + v.fees
	})).sort((a, b) => b.total - a.total);
	const ccCostsTotal = ccCostsByAccount.reduce((sum, r) => sum + r.total, 0);

	const ccMonths = Array.from(new Set(state.transactions.map((t) => t.date.slice(0, 7))))
		.sort()
		.slice(-6);
	const ccMonthlyTrend = ccMonths.map((month) => {
		let interest = 0;
		let fees = 0;
		for (const t of state.transactions) {
			if (t.flow !== 'out' || t.date.slice(0, 7) !== month) continue;
			if (t.category === 'Interest') interest += t.amount;
			else if (t.category === 'Fees') fees += t.amount;
		}
		return { month, interest, fees, total: interest + fees };
	});

	return {
		period,
		rollup,
		wasteful: wasteful.slice(0, 20),
		discretionary: discretionary.slice(0, 20),
		recurringWaste,
		majorPurchases,
		majorPurchasesTotal,
		ccCostsByAccount,
		ccCostsTotal,
		ccMonthlyTrend,
		categoryTags: state.categoryTags
	};
};
