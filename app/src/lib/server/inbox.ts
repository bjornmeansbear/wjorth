import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import Papa from 'papaparse';
import type { AppState } from '$lib/finance/types';
import { guessMapping, type GuessedMapping } from '$lib/finance/csv';

const INBOX_DIR = 'data/inbox';
const PROCESSED_DIR = 'data/inbox/processed';

export interface InboxFile {
	fileName: string;
	headers: string[];
	previewRows: Record<string, string>[];
	guessedMapping: GuessedMapping;
}

function sha1(buf: Buffer): string {
	return createHash('sha1').update(buf).digest('hex');
}

// Scans data/inbox/*.csv (excluding processed/), skipping any file whose
// CONTENT hash already appears in state.importedFiles. Hashing content
// (not just filename) matters because banks often re-export under the same
// filename with different/extended contents.
export async function scanInbox(state: AppState): Promise<InboxFile[]> {
	await mkdir(INBOX_DIR, { recursive: true });
	await mkdir(PROCESSED_DIR, { recursive: true });

	const entries = await readdir(INBOX_DIR, { withFileTypes: true });
	const candidates = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.csv'));

	const knownHashes = new Set(state.importedFiles.map((f) => f.contentHash));
	const results: InboxFile[] = [];

	for (const entry of candidates) {
		const filePath = join(INBOX_DIR, entry.name);
		const buf = await readFile(filePath);
		const hash = sha1(buf);
		if (knownHashes.has(hash)) continue;

		const parsed = Papa.parse<Record<string, string>>(buf.toString('utf-8'), {
			header: true,
			skipEmptyLines: true,
			preview: 5
		});
		const headers = parsed.meta.fields ?? [];

		results.push({
			fileName: entry.name,
			headers,
			previewRows: parsed.data,
			guessedMapping: guessMapping(headers)
		});
	}

	return results;
}

export async function readInboxFile(fileName: string): Promise<string> {
	const buf = await readFile(join(INBOX_DIR, fileName));
	return buf.toString('utf-8');
}

export async function hashInboxFile(fileName: string): Promise<string> {
	const buf = await readFile(join(INBOX_DIR, fileName));
	return sha1(buf);
}

// Moves a fully-imported file into processed/ so the inbox folder stays
// clean for the user's actual weekly/monthly drop-in-files workflow. If a
// file with that name already exists there, append a timestamp suffix
// rather than overwrite, so the processed archive never silently loses one.
export async function moveToProcessed(fileName: string): Promise<void> {
	await mkdir(PROCESSED_DIR, { recursive: true });
	const src = join(INBOX_DIR, fileName);
	let dest = join(PROCESSED_DIR, fileName);
	try {
		await readFile(dest);
		const stamp = new Date().toISOString().replace(/[:.]/g, '-');
		const dotIdx = fileName.lastIndexOf('.');
		const stamped = dotIdx === -1 ? `${fileName}-${stamp}` : `${fileName.slice(0, dotIdx)}-${stamp}${fileName.slice(dotIdx)}`;
		dest = join(PROCESSED_DIR, stamped);
	} catch {
		// dest doesn't exist yet — use the plain filename.
	}
	await rename(src, dest);
}
