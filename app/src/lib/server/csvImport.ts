import Papa from 'papaparse';
import type { AppState, ImportedFile, Transaction } from '$lib/finance/types';
import { parseImportDate } from '$lib/finance/dates';
import { parseAmount } from '$lib/finance/amounts';
import { categorize } from '$lib/finance/categorize';
import { hashId } from '$lib/finance/dedupe';
import type { ImportMode } from '$lib/finance/csv';

export interface ImportMapping {
	acct: string;
	dateCol: string;
	descCol: string;
	amountCol: string;
	debitCol: string;
	creditCol: string;
	mode: ImportMode;
	invert: boolean;
}

export interface ImportResult {
	added: number;
	skipped: number;
}

// Ported from v1's importFile. Mutates state in place: appends new
// transactions, adds the account if new. Duplicate rows (same dedupe id)
// and rows that fail to resolve a date/description are both counted as
// "skipped" without distinguishing which, same as v1 (an honest port of a
// known minor UX gap, not worth a new distinction here).
export function importCsvRows(state: AppState, csvText: string, mapping: ImportMapping): ImportResult {
	const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
	const rows = parsed.data;

	let added = 0;
	let skipped = 0;

	if (!state.accounts.includes(mapping.acct)) {
		state.accounts.push(mapping.acct);
	}

	const existingIds = new Set(state.transactions.map((t) => t.id));

	for (const row of rows) {
		const date = parseImportDate(mapping.dateCol ? row[mapping.dateCol] : null);
		const desc = mapping.descCol ? (row[mapping.descCol] ?? '').trim() : '';

		if (!date || !desc) {
			skipped++;
			continue;
		}

		let amount = 0;
		let flow: 'in' | 'out';

		if (mapping.mode === 'split') {
			const deb = mapping.debitCol ? parseAmount(row[mapping.debitCol]) : 0;
			const cred = mapping.creditCol ? parseAmount(row[mapping.creditCol]) : 0;
			if (Math.abs(deb) > 0) {
				amount = Math.abs(deb);
				flow = 'out';
			} else if (Math.abs(cred) > 0) {
				amount = Math.abs(cred);
				flow = 'in';
			} else {
				skipped++;
				continue;
			}
		} else {
			const raw = mapping.amountCol ? parseAmount(row[mapping.amountCol]) : 0;
			if (raw === 0) {
				skipped++;
				continue;
			}
			let isOut = raw < 0;
			if (mapping.invert) isOut = !isOut;
			amount = Math.abs(raw);
			flow = isOut ? 'out' : 'in';
		}

		const id = hashId(mapping.acct, date, desc, amount, flow);
		if (existingIds.has(id)) {
			skipped++;
			continue;
		}

		const txn: Transaction = {
			id,
			date,
			description: desc,
			account: mapping.acct,
			amount,
			flow,
			category: categorize(desc, state.rules),
			manual: false,
			tag: null,
			isMajorPurchase: false
		};

		state.transactions.push(txn);
		existingIds.add(id);
		added++;
	}

	return { added, skipped };
}

export function recordImportedFile(state: AppState, fileName: string, contentHash: string, result: ImportResult): void {
	const record: ImportedFile = {
		fileName,
		contentHash,
		importedAt: new Date().toISOString(),
		added: result.added,
		skipped: result.skipped
	};
	state.importedFiles.push(record);
}
