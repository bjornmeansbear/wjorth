import type { Transaction } from './types';
import { normalizeMerchant } from './merchant';
import { diffCalendarDays } from './dates';

export interface RecurringGroup {
	merchant: string; // raw description of the first transaction in the group
	normalizedKey: string;
	avg: number;
	count: number;
	annual: number;
	transactions: Transaction[];
}

// Ported from v1's detectRecurring. Always operates on FULL history —
// callers must not pre-filter by period, same as v1 (a subscription from
// years ago should still surface even while browsing a narrower period).
export function detectRecurring(transactions: Transaction[]): RecurringGroup[] {
	const groups = new Map<string, Transaction[]>();

	for (const t of transactions) {
		if (t.flow !== 'out') continue;
		const key = normalizeMerchant(t.description);
		if (!key) continue;
		const list = groups.get(key) ?? [];
		list.push(t);
		groups.set(key, list);
	}

	const results: RecurringGroup[] = [];

	for (const [key, txs] of groups) {
		if (txs.length < 2) continue;

		const amounts = txs.map((t) => t.amount);
		const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
		if (avg <= 0) continue;

		const consistent = amounts.every((a) => Math.abs(a - avg) / avg < 0.15);
		if (!consistent) continue;

		const sorted = [...txs].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
		let monthlyish = sorted.length >= 2;
		for (let i = 1; i < sorted.length; i++) {
			const days = diffCalendarDays(sorted[i].date, sorted[i - 1].date);
			if (days < 18 || days > 45) monthlyish = false;
		}

		if (monthlyish) {
			results.push({
				merchant: txs[0].description,
				normalizedKey: key,
				avg,
				count: txs.length,
				annual: avg * 12,
				transactions: txs
			});
		}
	}

	return results.sort((a, b) => b.annual - a.annual);
}

export interface PayGroup {
	source: string; // raw description of the first transaction in the group
	avgAmount: number;
	avgIntervalDays: number;
	count: number;
	// Scaled by actual cadence (avgAmount * 30.44/avgIntervalDays), not a flat
	// *12 like detectRecurring — pay cadences vary (weekly, biweekly,
	// semi-monthly, monthly), unlike expense subscriptions which are almost
	// always monthly, so a fixed multiplier would misstate biweekly pay by ~8%.
	monthlyEquivalent: number;
	transactions: Transaction[];
}

// Mirrors detectRecurring's grouping/tolerance approach but for income, so
// zero-based budgeting has a clear, obvious answer to "what's my monthly
// pay" even when paychecks don't land evenly across calendar months (a
// biweekly paycheck lands 3 times in some months, 2 in others). Always
// operates on full history, same as detectRecurring — callers must not
// pre-filter by period.
export function detectRecurringIncome(transactions: Transaction[]): PayGroup[] {
	const groups = new Map<string, Transaction[]>();

	for (const t of transactions) {
		if (t.flow !== 'in' || t.category === 'Transfer') continue;
		const key = normalizeMerchant(t.description);
		if (!key) continue;
		const list = groups.get(key) ?? [];
		list.push(t);
		groups.set(key, list);
	}

	const results: PayGroup[] = [];

	for (const txs of groups.values()) {
		if (txs.length < 2) continue;

		const amounts = txs.map((t) => t.amount);
		const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
		if (avgAmount <= 0) continue;

		const consistent = amounts.every((a) => Math.abs(a - avgAmount) / avgAmount < 0.15);
		if (!consistent) continue;

		const sorted = [...txs].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
		const gaps: number[] = [];
		for (let i = 1; i < sorted.length; i++) {
			gaps.push(diffCalendarDays(sorted[i].date, sorted[i - 1].date));
		}
		const avgIntervalDays = gaps.reduce((a, b) => a + b, 0) / gaps.length;
		// Guard against same-day duplicate noise (e.g. a correction/reversal
		// posted the same day) rather than treating it as a pay cadence.
		if (avgIntervalDays < 3) continue;

		results.push({
			source: txs[0].description,
			avgAmount,
			avgIntervalDays,
			count: txs.length,
			monthlyEquivalent: avgAmount * (30.44 / avgIntervalDays),
			transactions: txs
		});
	}

	return results.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
}
