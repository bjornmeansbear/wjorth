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
		Housing: 'essential',
		// Separate from Housing (the fixed mortgage/rent line) on purpose —
		// repair/contractor costs are irregular and lumpy, a natural fit for
		// a sinking fund, unlike the predictable monthly mortgage payment.
		'Home Maintenance': 'essential',
		Subscriptions: 'discretionary',
		Dining: 'discretionary',
		Shopping: 'discretionary',
		Cash: 'discretionary',
		// Not essential in the survival sense, and not wasteful either — a
		// values-driven choice with real intended impact. Per standard
		// zero-based budgeting methodology, giving gets its own bucket
		// alongside saving and spending rather than folding into Shopping.
		Giving: 'discretionary',
		Entertainment: 'discretionary',
		// Kids' lessons/sports/camps — a real, valued choice for the family,
		// same spirit as Giving, not essential in the survival sense.
		'Kids Activities': 'discretionary',
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
