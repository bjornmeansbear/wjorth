import type { Transaction } from './types';
import { diffCalendarDays, mondayOf } from './dates';

export interface CategoryBucket {
	category: string;
	amount: number;
}

// Ported from v1's renderCatChart: outflow-only, Transfer-excluded, top 8
// categories by spend + remainder bucketed as a single trailing "Other".
export function bucketByCategory(transactions: Transaction[]): CategoryBucket[] {
	const byCat = new Map<string, number>();
	for (const t of transactions) {
		if (t.flow !== 'out' || t.category === 'Transfer') continue;
		byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
	}
	const entries = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);
	const top = entries.slice(0, 8).map(([category, amount]) => ({ category, amount }));
	const otherSum = entries.slice(8).reduce((sum, [, amt]) => sum + amt, 0);
	if (otherSum > 0) top.push({ category: 'Other', amount: otherSum });
	return top;
}

export interface TimeBucket {
	key: string; // YYYY-MM-DD (week start) or YYYY-MM
	amount: number;
}

// Ported from v1's renderTimeChart: weekly buckets if the outflow date-span
// is <=90 days, monthly otherwise. Span is computed from the actual
// transactions present, not the period-filter boundary.
export function bucketByTime(transactions: Transaction[]): TimeBucket[] {
	const outflow = transactions.filter((t) => t.flow === 'out' && t.category !== 'Transfer');
	if (outflow.length === 0) return [];

	const dates = outflow.map((t) => t.date).sort();
	const span = diffCalendarDays(dates[dates.length - 1], dates[0]);
	const monthly = span > 90;

	const buckets = new Map<string, number>();
	for (const t of outflow) {
		const key = monthly ? t.date.slice(0, 7) : mondayOf(t.date);
		buckets.set(key, (buckets.get(key) ?? 0) + t.amount);
	}

	return Array.from(buckets.entries())
		.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
		.map(([key, amount]) => ({ key, amount }));
}

export interface MerchantTotal {
	description: string;
	amount: number;
}

// Ported from v1's renderMerchants: grouped by RAW description (not
// normalizeMerchant), outflow-only, Transfer-excluded, top 10.
export function topMerchants(transactions: Transaction[], limit = 10): MerchantTotal[] {
	const byDesc = new Map<string, number>();
	for (const t of transactions) {
		if (t.flow !== 'out' || t.category === 'Transfer') continue;
		byDesc.set(t.description, (byDesc.get(t.description) ?? 0) + t.amount);
	}
	return Array.from(byDesc.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([description, amount]) => ({ description, amount }));
}
