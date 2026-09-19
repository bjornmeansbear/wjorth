import type { RequestHandler } from './$types';
import { loadState } from '$lib/server/store';

// Ported from v1: dumps ALL transactions (ignoring any period filter) as
// CSV, columns date,description,account,category,flow,amount — amount is
// always the positive magnitude with flow as a separate column.
function csvField(value: string): string {
	if (value.includes(',') || value.includes('"')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

export const GET: RequestHandler = async () => {
	const state = await loadState();

	const header = ['date', 'description', 'account', 'category', 'flow', 'amount'];
	const lines = [header.join(',')];

	for (const t of state.transactions) {
		lines.push(
			[csvField(t.date), csvField(t.description), csvField(t.account), csvField(t.category), t.flow, String(t.amount)].join(',')
		);
	}

	return new Response(lines.join('\n'), {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': 'attachment; filename="wjorth-export.csv"'
		}
	});
};
