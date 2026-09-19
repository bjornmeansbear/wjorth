import type { NecessityTag } from './types';

// Sensible per-category defaults for the essential/discretionary/wasteful
// split. These are value judgments, not facts — always overridable per
// category here and per transaction on the ledger itself.
export function defaultCategoryTags(): Record<string, NecessityTag> {
	return {
		Groceries: 'essential',
		Transport: 'essential',
		Utilities: 'essential',
		Health: 'essential',
		Insurance: 'essential',
		Subscriptions: 'discretionary',
		Dining: 'discretionary',
		Shopping: 'discretionary',
		Cash: 'discretionary',
		// Fees and interest are close to definitionally avoidable cost —
		// exactly what a debt-aware, zero-based budgeter wants surfaced.
		Fees: 'wasteful',
		Interest: 'wasteful',
		// Inflow/internal-move categories — tag is computed but never shown in
		// outflow-facing "waste" views, which already filter flow==='out' and
		// exclude Transfer.
		Income: 'essential',
		Transfer: 'essential',
		// Deliberately NOT essential — an unreviewed transaction should surface
		// for attention rather than hide safely.
		Uncategorized: 'discretionary'
	};
}
