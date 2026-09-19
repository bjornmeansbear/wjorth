export type ImportMode = 'single' | 'split';

export interface GuessedMapping {
	dateCol: string;
	descCol: string;
	amountCol: string;
	debitCol: string;
	creditCol: string;
	mode: ImportMode;
}

// Ported verbatim from v1's guessHeader: candidate keywords are tried
// outer-loop, headers inner-loop — a header matching the FIRST candidate
// wins over a header matching a later, possibly-better-fitting candidate.
export function guessHeader(headers: string[], candidates: string[]): string {
	for (const candidate of candidates) {
		for (const header of headers) {
			if (header.toLowerCase().indexOf(candidate) !== -1) return header;
		}
	}
	return '';
}

export function guessMapping(headers: string[]): GuessedMapping {
	const dateCol = guessHeader(headers, ['date']);
	const descCol = guessHeader(headers, ['description', 'desc', 'payee', 'merchant', 'name', 'memo']);
	const amountCol = guessHeader(headers, ['amount']);
	const debitCol = guessHeader(headers, ['debit', 'withdrawal']);
	const creditCol = guessHeader(headers, ['credit', 'deposit']);

	// Ported verbatim: split mode only when there's no amount column but both
	// debit and credit columns exist; single mode otherwise (even if
	// amountCol is also empty).
	const mode: ImportMode = !amountCol && debitCol && creditCol ? 'split' : 'single';

	return { dateCol, descCol, amountCol, debitCol, creditCol, mode };
}
