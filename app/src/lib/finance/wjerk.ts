import type { AppState, Transaction } from './types';
import { yearOf } from './dates';

// Mirrors effectiveTag(): a transaction's own flag wins if set, otherwise
// it inherits from the merchant list. Adding a merchant instantly re-flows
// every non-overridden transaction, past and future — no backfill step.
export function merchantIsWjerk(description: string, wjerkMerchants: string[]): boolean {
	const d = description.toLowerCase();
	return wjerkMerchants.some((k) => d.includes(k));
}

export function isWjerk(txn: Transaction, wjerkMerchants: string[]): boolean {
	return txn.wjerk ?? merchantIsWjerk(txn.description, wjerkMerchants);
}

// Stores an override only when it differs from the merchant default, so
// flipping a checkbox back returns the transaction to "inherit" rather
// than pinning it forever.
export function setTransactionWjerk(state: AppState, transactionId: string, value: boolean): void {
	const txn = state.transactions.find((t) => t.id === transactionId);
	if (!txn) return;
	txn.wjerk = value === merchantIsWjerk(txn.description, state.wjerkMerchants) ? null : value;
}

export function wjerkTransactions(state: AppState, year?: string): Transaction[] {
	return state.transactions
		.filter((t) => isWjerk(t, state.wjerkMerchants))
		.filter((t) => !year || yearOf(t.date) === year)
		.sort((a, b) => a.date.localeCompare(b.date));
}

// Per-year totals for the Wjerk panel. Transfer excluded like every other
// rollup; money in (refunds, client payments) is kept separate from money
// out rather than netted, since an accountant treats them differently.
export function wjerkYearTotals(state: AppState): { year: string; out: number; in: number; count: number }[] {
	const byYear = new Map<string, { out: number; in: number; count: number }>();
	for (const t of wjerkTransactions(state)) {
		if (t.category === 'Transfer') continue;
		const y = yearOf(t.date);
		const entry = byYear.get(y) ?? { out: 0, in: 0, count: 0 };
		entry[t.flow] += t.amount;
		entry.count++;
		byYear.set(y, entry);
	}
	return Array.from(byYear, ([year, v]) => ({ year, ...v })).sort((a, b) => b.year.localeCompare(a.year));
}
