import type { RequestHandler } from './$types';
import { loadState } from '$lib/server/store';
import { isWjerk, wjerkTransactions } from '$lib/finance/wjerk';

// Ported from v1: dumps ALL transactions (ignoring any period filter) as
// CSV, columns date,description,account,category,flow,amount — amount is
// always the positive magnitude with flow as a separate column. v2 adds a
// trailing wjerk column, plus ?wjerk=1[&year=YYYY] for the accountant
// export: only Wjerk transactions, oldest first, one tax year at a time.
function csvField(value: string): string {
	if (value.includes(',') || value.includes('"')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

export const GET: RequestHandler = async ({ url }) => {
	const state = await loadState();
	const wjerkOnly = url.searchParams.get('wjerk') === '1';
	const yearParam = url.searchParams.get('year') ?? '';
	const year = /^\d{4}$/.test(yearParam) ? yearParam : undefined;

	const transactions = wjerkOnly ? wjerkTransactions(state, year) : state.transactions;

	const header = ['date', 'description', 'account', 'category', 'flow', 'amount', 'wjerk'];
	const lines = [header.join(',')];

	for (const t of transactions) {
		lines.push(
			[
				csvField(t.date),
				csvField(t.description),
				csvField(t.account),
				csvField(t.category),
				t.flow,
				String(t.amount),
				isWjerk(t, state.wjerkMerchants) ? 'yes' : ''
			].join(',')
		);
	}

	const fileName = wjerkOnly ? `wjerk-${year ?? 'all'}.csv` : 'wjorth-export.csv';
	return new Response(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="${fileName}"`
		}
	});
};
