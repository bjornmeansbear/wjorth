import type { AppState, NecessityTag, Transaction } from './types';

// Mirrors the `manual` override pattern: a transaction's own tag wins if
// set, otherwise it inherits the category's default, otherwise a safe
// fallback. Changing a category's default in state.categoryTags instantly
// re-flows every non-overridden transaction — nothing is denormalized until
// a user explicitly overrides it, so there's no backfill/migration step.
export function effectiveTag(txn: Transaction, categoryTags: Record<string, NecessityTag>): NecessityTag {
	return txn.tag ?? categoryTags[txn.category] ?? 'discretionary';
}

export interface TagRollup {
	essential: number;
	discretionary: number;
	wasteful: number;
}

// Outflow-only, Transfer-excluded — matches every other spend rollup in the
// app (KPIs, category chart, top merchants).
export function tagRollup(transactions: Transaction[], categoryTags: Record<string, NecessityTag>): TagRollup {
	const rollup: TagRollup = { essential: 0, discretionary: 0, wasteful: 0 };
	for (const t of transactions) {
		if (t.flow !== 'out' || t.category === 'Transfer') continue;
		rollup[effectiveTag(t, categoryTags)] += t.amount;
	}
	return rollup;
}

export function filterByTag(
	transactions: Transaction[],
	tag: NecessityTag,
	categoryTags: Record<string, NecessityTag>
): Transaction[] {
	return transactions.filter(
		(t) => t.flow === 'out' && t.category !== 'Transfer' && effectiveTag(t, categoryTags) === tag
	);
}

export function setCategoryTag(state: AppState, category: string, tag: NecessityTag): void {
	state.categoryTags[category] = tag;
}

export function setTransactionTag(state: AppState, transactionId: string, tag: NecessityTag | null): void {
	const txn = state.transactions.find((t) => t.id === transactionId);
	if (txn) txn.tag = tag;
}
