import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { loadState, updateState } from '$lib/server/store';
import { budgetRows, setBudget as setBudgetRow, totalIncome, unallocated } from '$lib/finance/budgets';

function currentMonth(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const load: PageServerLoad = async ({ url }) => {
	const state = await loadState();
	const month = url.searchParams.get('month') ?? currentMonth();

	return {
		month,
		rows: budgetRows(state, month),
		income: totalIncome(state, month),
		unallocated: unallocated(state, month),
		categoryTags: state.categoryTags
	};
};

export const actions: Actions = {
	setBudget: async ({ request }) => {
		const form = await request.formData();
		const month = String(form.get('month') ?? '');
		const category = String(form.get('category') ?? '');
		const allocated = Number(form.get('allocated') ?? 0);
		if (!month || !category || isNaN(allocated)) return fail(400, { message: 'Missing/invalid fields' });

		await updateState((state) => {
			setBudgetRow(state, month, category, allocated);
		});
		return { updated: true };
	}
};
