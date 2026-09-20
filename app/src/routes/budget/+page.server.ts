import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { loadState, updateState } from '$lib/server/store';
import {
	budgetRows,
	setBudget as setBudgetRow,
	coverOverspend as coverOverspendRow,
	setSinkingFund as setSinkingFundRow,
	suggestBudget,
	totalIncome,
	estimatedMonthlyIncome,
	unallocated,
	isExplicitBudget
} from '$lib/finance/budgets';
import { detectRecurringIncome } from '$lib/finance/recurring';

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
		actualIncome: totalIncome(state, month),
		estimatedIncome: estimatedMonthlyIncome(state, month),
		payGroups: detectRecurringIncome(state.transactions),
		unallocated: unallocated(state, month),
		categoryTags: state.categoryTags,
		sinkingFunds: state.sinkingFunds
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
	},

	coverOverspend: async ({ request }) => {
		const form = await request.formData();
		const month = String(form.get('month') ?? '');
		const fromCategory = String(form.get('fromCategory') ?? '');
		const toCategory = String(form.get('toCategory') ?? '');
		const amount = Number(form.get('amount') ?? 0);
		if (!month || !fromCategory || !toCategory || isNaN(amount) || amount <= 0) {
			return fail(400, { message: 'Missing/invalid fields' });
		}

		await updateState((state) => {
			coverOverspendRow(state, month, fromCategory, toCategory, amount);
		});
		return { updated: true };
	},

	setSinkingFund: async ({ request }) => {
		const form = await request.formData();
		const category = String(form.get('category') ?? '');
		const annualTarget = Number(form.get('annualTarget') ?? 0);
		if (!category || isNaN(annualTarget)) return fail(400, { message: 'Missing/invalid fields' });

		await updateState((state) => {
			setSinkingFundRow(state, category, annualTarget);
		});
		return { updated: true };
	},

	applySuggestedBudget: async ({ request }) => {
		const form = await request.formData();
		const month = String(form.get('month') ?? '');
		if (!month) return fail(400, { message: 'Missing month' });

		let applied = 0;
		await updateState((state) => {
			const suggestion = suggestBudget(state, month);
			for (const [category, amount] of Object.entries(suggestion)) {
				// Never overwrite a category that's already been explicitly
				// budgeted this month — this is a one-time fill-in-the-blanks,
				// not a standing rule like a sinking fund.
				if (isExplicitBudget(state, month, category)) continue;
				setBudgetRow(state, month, category, amount);
				applied++;
			}
		});
		return { updated: true, applied };
	}
};
