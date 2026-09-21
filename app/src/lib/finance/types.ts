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
}

export const STATE_VERSION = 1;
