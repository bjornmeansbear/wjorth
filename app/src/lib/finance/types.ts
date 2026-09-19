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
}

export const STATE_VERSION = 1;
