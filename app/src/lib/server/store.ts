import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { AppState } from '$lib/finance/types';
import { STATE_VERSION } from '$lib/finance/types';
import { defaultRules } from '$lib/finance/defaultRules';
import { defaultCategoryTags } from '$lib/finance/defaultCategoryTags';

const STATE_PATH = 'data/state.json';

function emptyState(): AppState {
	return {
		version: STATE_VERSION,
		transactions: [],
		rules: defaultRules(),
		accounts: [],
		budgets: [],
		categoryTags: defaultCategoryTags(),
		importedFiles: []
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
