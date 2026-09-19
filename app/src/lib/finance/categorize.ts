import type { AppState, Transaction } from './types';
import { normalizeMerchant } from './merchant';

// Ported verbatim from v1: lowercase, first substring match wins, rules
// array order is load-bearing.
export function categorize(desc: string, rules: { keyword: string; category: string }[]): string {
	const d = desc.toLowerCase();
	for (const rule of rules) {
		if (d.indexOf(rule.keyword.toLowerCase()) !== -1) return rule.category;
	}
	return 'Uncategorized';
}

// Ported from v1's transaction-table inline-edit handler. Encapsulates the
// whole multi-step invariant in one place: set manual, upsert a rule keyed
// on the exact normalized-merchant string (unshifted so it wins), and
// immediately retag every OTHER non-manual transaction sharing that same
// merchant fingerprint. Manually-tagged transactions are never touched.
export function learnFromEdit(state: AppState, transactionId: string, newCategory: string): void {
	const txn = state.transactions.find((t) => t.id === transactionId);
	if (!txn) return;

	txn.category = newCategory;
	txn.manual = true;

	const key = normalizeMerchant(txn.description);
	if (key) {
		const existing = state.rules.find((r) => r.keyword === key);
		if (existing) {
			existing.category = newCategory;
		} else {
			state.rules.unshift({ keyword: key, category: newCategory });
		}

		for (const other of state.transactions) {
			if (other.id === txn.id) continue;
			if (other.manual) continue;
			if (normalizeMerchant(other.description) === key) {
				other.category = newCategory;
			}
		}
	}
}

export function allCategories(state: AppState): string[] {
	const set = new Set<string>(['Uncategorized']);
	for (const r of state.rules) set.add(r.category);
	for (const t of state.transactions) set.add(t.category);
	return Array.from(set).sort();
}

export type { Transaction };
