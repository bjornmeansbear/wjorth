import type { Transaction } from './types';
import { yearOf } from './dates';

export type PeriodKey = 'all' | 'month' | '3m' | '6m' | 'ytd' | 'year' | string; // string = a specific "YYYY"

export interface PeriodRange {
	start: string | null; // YYYY-MM-DD, null = no lower bound
	end: string | null; // YYYY-MM-DD, null = no upper bound
}

function pad2(n: number): string {
	return String(n).padStart(2, '0');
}

// Extends v1's getPeriodRange. Every existing v1 option (all/month/3m/6m/ytd)
// keeps its exact "no upper bound" behavior — this is a strictly additive
// change. Selecting a specific historical year ("2024") is the one case
// that needs an upper bound too.
export function getPeriodRange(period: PeriodKey, now: Date = new Date()): PeriodRange {
	const y = now.getFullYear();
	const m = now.getMonth();

	if (period === 'all') return { start: null, end: null };

	if (period === 'month') {
		return { start: `${y}-${pad2(m + 1)}-01`, end: null };
	}
	if (period === '3m') {
		const d = new Date(y, m - 2, 1);
		return { start: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`, end: null };
	}
	if (period === '6m') {
		const d = new Date(y, m - 5, 1);
		return { start: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`, end: null };
	}
	if (period === 'ytd' || period === 'year') {
		return { start: `${y}-01-01`, end: null };
	}

	// A specific "YYYY" historical year.
	if (/^\d{4}$/.test(period)) {
		return { start: `${period}-01-01`, end: `${period}-12-31` };
	}

	return { start: null, end: null };
}

export function inRange(date: string, range: PeriodRange): boolean {
	if (range.start && date < range.start) return false;
	if (range.end && date > range.end) return false;
	return true;
}

export function filterByPeriod(transactions: Transaction[], period: PeriodKey, now: Date = new Date()): Transaction[] {
	const range = getPeriodRange(period, now);
	if (!range.start && !range.end) return transactions;
	return transactions.filter((t) => inRange(t.date, range));
}

// Distinct years present across ALL transactions (not period-filtered),
// sorted descending, driving the year-picker dynamically as more CSVs get
// imported over time — no hardcoded year list.
export function availableYears(transactions: Transaction[]): string[] {
	const years = new Set<string>();
	for (const t of transactions) years.add(yearOf(t.date));
	return Array.from(years).sort((a, b) => b.localeCompare(a));
}
