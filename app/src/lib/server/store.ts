import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { AppState } from '$lib/finance/types';
import { STATE_VERSION } from '$lib/finance/types';
import { defaultRules } from '$lib/finance/defaultRules';
import { defaultCategoryTags } from '$lib/finance/defaultCategoryTags';

const STATE_PATH = 'data/state.json';
const BACKUPS_DIR = 'data/backups';
const BACKUP_RETENTION_DAYS = 30;

function todayStamp(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Snapshots the CURRENT on-disk state.json (before it gets overwritten) into
// data/backups/state-YYYY-MM-DD.json — at most once per calendar day, so a
// long editing session doesn't spam backups, but every day you touched the
// app has a same-day rollback point. Plain JSON copies, same "grab the file
// yourself" philosophy as state.json itself.
async function snapshotBeforeWrite(): Promise<void> {
	const backupPath = `${BACKUPS_DIR}/state-${todayStamp()}.json`;
	try {
		await readFile(backupPath, 'utf-8');
		return; // already snapshotted today
	} catch {
		// no snapshot yet today — fall through and take one
	}

	let current: string;
	try {
		current = await readFile(STATE_PATH, 'utf-8');
	} catch {
		return; // no state.json yet (first run) — nothing to snapshot
	}

	await mkdir(BACKUPS_DIR, { recursive: true });
	await writeFile(backupPath, current, 'utf-8');
	await pruneOldBackups();
}

async function pruneOldBackups(): Promise<void> {
	let files: string[];
	try {
		files = await readdir(BACKUPS_DIR);
	} catch {
		return;
	}
	const cutoff = Date.now() - BACKUP_RETENTION_DAYS * 86400000;
	for (const f of files) {
		const match = f.match(/^state-(\d{4}-\d{2}-\d{2})\.json$/);
		if (!match) continue;
		if (new Date(match[1]).getTime() < cutoff) {
			await unlink(`${BACKUPS_DIR}/${f}`).catch(() => {});
		}
	}
}

function emptyState(): AppState {
	return {
		version: STATE_VERSION,
		transactions: [],
		rules: defaultRules(),
		accounts: [],
		budgets: [],
		categoryTags: defaultCategoryTags(),
		importedFiles: [],
		sinkingFunds: {}
	};
}

async function readState(): Promise<AppState> {
	try {
		const raw = await readFile(STATE_PATH, 'utf-8');
		return JSON.parse(raw) as AppState;
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
			const fresh = emptyState();
			await writeStateNow(fresh);
			return fresh;
		}
		throw err;
	}
}

async function writeStateNow(state: AppState): Promise<void> {
	await mkdir(dirname(STATE_PATH), { recursive: true });
	await snapshotBeforeWrite();
	const tmpPath = `${STATE_PATH}.tmp`;
	await writeFile(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
	// Atomic on the same filesystem — a crash mid-write never leaves state.json
	// half-written; worst case the in-flight write is lost, never the file.
	await rename(tmpPath, STATE_PATH);
}

// Single-user, single-machine, almost-always-single-tab app — a real
// database or file-locking library would be overkill. This in-memory
// promise chain is the whole concurrency story: it guarantees writes from
// concurrent requests within this one Node process never interleave. It
// does NOT solve multi-process/multi-machine concurrency (e.g. two `node
// build` instances pointed at the same data/ folder) — out of scope for a
// personal local tool.
let writeQueue: Promise<unknown> = Promise.resolve();

export async function loadState(): Promise<AppState> {
	return readState();
}

export async function saveState(state: AppState): Promise<void> {
	writeQueue = writeQueue.then(() => writeStateNow(state));
	return writeQueue as Promise<void>;
}

// Convenience for the common "read, mutate, write" pattern used by form
// actions. Not a transaction (no read-lock) — fine for a single-tab local
// tool per the concurrency note above.
export async function updateState(mutate: (state: AppState) => void): Promise<AppState> {
	const state = await readState();
	mutate(state);
	await saveState(state);
	return state;
}
