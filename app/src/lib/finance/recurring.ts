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
