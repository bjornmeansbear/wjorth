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

	return {
		period,
		rollup,
		wasteful: wasteful.slice(0, 20),
		discretionary: discretionary.slice(0, 20),
		recurringWaste,
		categoryTags: state.categoryTags
	};
};
