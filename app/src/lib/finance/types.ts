export type Flow = 'in' | 'out';
export type NecessityTag = 'essential' | 'discretionary' | 'wasteful';

export interface Transaction {
	id: string; // hashId(account|date|description|amount|flow) — dedupe key
	date: string; // YYYY-MM-DD, local calendar date
	description: string; // raw, from the CSV
	account: string; // user-labeled at import time
	amount: number; // always positive
	flow: Flow;
	category: string;
	manual: boolean; // true once a user has hand-edited the category
	tag: NecessityTag | null; // null = inherit categoryTags[category] default
	// A one-time capital purchase (a car, a major appliance) marked so it
	// keeps its real category (Transport, Housing, ...) instead of losing
	// that context to a generic "Major Purchases" bucket — a flag alongside
	// category and tag, not a replacement for either. Excluded from the
	// trailing-average calculation suggestBudget() uses, so a single large
	// purchase doesn't permanently skew future budget suggestions for that
	// category; still counts normally in the month it actually happened.
	isMajorPurchase: boolean;
	// Wjerk = the user's business. Marks a deductible business expense (or
	// business income) for the accountant export — another flag alongside
	// category, same "real category stays visible" reasoning as
	// isMajorPurchase. null = inherit from state.wjerkMerchants, mirroring
	// how `tag` inherits from categoryTags.
	wjerk: boolean | null;
}

export interface Rule {
	keyword: string;
	category: string;
}

export interface Budget {
	month: string; // "YYYY-MM"
	category: string;
	allocated: number;
}

// A balance being paid down on /payoff. Typed in from a statement — CSVs
// carry transactions, not balances, so this can't be derived.
export interface Debt {
	id: string;
	name: string;
	account: string | null; // imported account this is, if any — links to its interest history
	balance: number;
	apr: number; // percent, e.g. 27.99
	minPayment: number;
	// Intro rate (a balance-transfer card). promoApr applies for the first
	// promoMonths months of the simulation, then apr. null = no promo.
	promoApr: number | null;
	promoMonths: number;
}

export interface ImportedFile {
	fileName: string;
	contentHash: string; // sha1 of the raw file bytes
	importedAt: string; // ISO 8601 timestamp
	added: number;
	skipped: number;
}

export interface AppState {
	version: number;
	transactions: Transaction[];
	rules: Rule[];
	accounts: string[];
	budgets: Budget[];
	categoryTags: Record<string, NecessityTag>;
	importedFiles: ImportedFile[];
	// category -> annual target for irregular-but-predictable costs (annual
	// insurance premiums, car maintenance, holiday spending). Presence of an
	// entry here is what makes a category a "sinking fund" — its suggested
	// monthly allocation becomes annualTarget/12 until a real Budget row is
	// set explicitly for a given month, which always wins.
	sinkingFunds: Record<string, number>;
	// Lowercase substring keywords (same matching as Rules) whose
	// transactions default to Wjerk. Any substring match counts — unlike
	// Rules, order doesn't matter since there's only one outcome.
	wjerkMerchants: string[];
	debts: Debt[];
	// What the user commits to paying toward all debts each month, and how
	// the extra above minimums is aimed. null = not set yet (the page
	// suggests recent actual payments).
	payoff: { monthly: number | null; strategy: 'avalanche' | 'snowball' };
}

export const STATE_VERSION = 1;
