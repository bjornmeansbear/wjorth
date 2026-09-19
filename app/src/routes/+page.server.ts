import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { loadState, updateState } from '$lib/server/store';
import { scanInbox, readInboxFile, hashInboxFile, moveToProcessed } from '$lib/server/inbox';
import { importCsvRows, recordImportedFile, type ImportMapping } from '$lib/server/csvImport';
import { learnFromEdit, allCategories } from '$lib/finance/categorize';
import { computeKpis } from '$lib/finance/kpis';
import { bucketByCategory, bucketByTime, topMerchants } from '$lib/finance/charts';
import { detectRecurring } from '$lib/finance/recurring';
import { filterByPeriod, availableYears, type PeriodKey } from '$lib/finance/period';
import { setCategoryTag, setTransactionTag, tagRollup } from '$lib/finance/tags';

export const load: PageServerLoad = async ({ url }) => {
	const state = await loadState();
	const inboxFiles = await scanInbox(state);

	const period = (url.searchParams.get('period') ?? 'all') as PeriodKey;
	const filtered = filterByPeriod(state.transactions, period);

	return {
		state,
		inboxFiles,
		period,
		years: availableYears(state.transactions),
		categories: allCategories(state),
		kpis: computeKpis(filtered),
		categoryChart: bucketByCategory(filtered),
		timeChart: bucketByTime(filtered),
		recurring: detectRecurring(state.transactions), // full history, ignores period — matches v1
		topMerchants: topMerchants(filtered),
		tagRollup: tagRollup(filtered, state.categoryTags)
	};
};

export const actions: Actions = {
	importFile: async ({ request }) => {
		const form = await request.formData();
		const fileName = String(form.get('fileName') ?? '');
		if (!fileName) return fail(400, { message: 'Missing fileName' });

		const mapping: ImportMapping = {
			acct: String(form.get('acct') ?? fileName.replace(/\.csv$/i, '')),
			dateCol: String(form.get('dateCol') ?? ''),
			descCol: String(form.get('descCol') ?? ''),
			amountCol: String(form.get('amountCol') ?? ''),
			debitCol: String(form.get('debitCol') ?? ''),
			creditCol: String(form.get('creditCol') ?? ''),
			mode: form.get('mode') === 'split' ? 'split' : 'single',
			invert: form.get('invert') === 'on'
		};

		const csvText = await readInboxFile(fileName);
		const contentHash = await hashInboxFile(fileName);

		let added = 0;
		let skipped = 0;
		await updateState((state) => {
			const res = importCsvRows(state, csvText, mapping);
			added = res.added;
			skipped = res.skipped;
			recordImportedFile(state, fileName, contentHash, res);
		});

		await moveToProcessed(fileName);

		return { imported: true, fileName, added, skipped };
	},

	discardFile: async ({ request }) => {
		const form = await request.formData();
		const fileName = String(form.get('fileName') ?? '');
		if (!fileName) return fail(400, { message: 'Missing fileName' });
		await moveToProcessed(fileName);
		return { discarded: true, fileName };
	},

	editCategory: async ({ request }) => {
		const form = await request.formData();
		const transactionId = String(form.get('transactionId') ?? '');
		const category = String(form.get('category') ?? '');
		if (!transactionId || !category) return fail(400, { message: 'Missing fields' });

		await updateState((state) => {
			learnFromEdit(state, transactionId, category);
		});
		return { updated: true };
	},

	setTransactionTag: async ({ request }) => {
		const form = await request.formData();
		const transactionId = String(form.get('transactionId') ?? '');
		const tagRaw = String(form.get('tag') ?? '');
		const tag = tagRaw === '' ? null : (tagRaw as 'essential' | 'discretionary' | 'wasteful');
		if (!transactionId) return fail(400, { message: 'Missing transactionId' });

		await updateState((state) => {
			setTransactionTag(state, transactionId, tag);
		});
		return { updated: true };
	},

	setCategoryTag: async ({ request }) => {
		const form = await request.formData();
		const category = String(form.get('category') ?? '');
		const tag = String(form.get('tag') ?? '') as 'essential' | 'discretionary' | 'wasteful';
		if (!category || !tag) return fail(400, { message: 'Missing fields' });

		await updateState((state) => {
			setCategoryTag(state, category, tag);
		});
		return { updated: true };
	},

	addRule: async ({ request }) => {
		const form = await request.formData();
		const keyword = String(form.get('keyword') ?? '')
			.trim()
			.toLowerCase();
		const category = String(form.get('category') ?? '').trim();
		if (!keyword || !category) return fail(400, { message: 'Missing fields' });

		await updateState((state) => {
			state.rules.unshift({ keyword, category });
		});
		return { added: true };
	},

	deleteRule: async ({ request }) => {
		const form = await request.formData();
		const keyword = String(form.get('keyword') ?? '');

		await updateState((state) => {
			state.rules = state.rules.filter((r) => r.keyword !== keyword);
		});
		return { deleted: true };
	}
};
