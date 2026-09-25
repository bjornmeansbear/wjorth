import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { loadState, updateState } from '$lib/server/store';
import { cardHistory } from '$lib/finance/payoff';
import type { Debt } from '$lib/finance/types';

export const load: PageServerLoad = async () => {
	const state = await loadState();
	return {
		debts: state.debts,
		payoff: state.payoff,
		history: cardHistory(state)
	};
};

function num(form: FormData, key: string): number {
	return Number(form.get(key) ?? NaN);
}

export const actions: Actions = {
	saveDebt: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const balance = num(form, 'balance');
		const apr = num(form, 'apr');
		const minPayment = num(form, 'minPayment');
		if (!name || [balance, apr, minPayment].some((n) => isNaN(n) || n < 0)) {
			return fail(400, { message: 'Name, balance, APR and minimum are required, and can’t be negative.' });
		}

		const account = String(form.get('account') ?? '') || null;
		const promoAprRaw = String(form.get('promoApr') ?? '');
		const debt: Debt = {
			id: String(form.get('id') ?? '') || crypto.randomUUID(),
			name,
			account,
			balance,
			apr,
			minPayment,
			promoApr: promoAprRaw === '' ? null : Number(promoAprRaw),
			promoMonths: Number(form.get('promoMonths') ?? 0) || 0
		};

		await updateState((state) => {
			const i = state.debts.findIndex((d) => d.id === debt.id);
			if (i === -1) state.debts.push(debt);
			else state.debts[i] = debt;
		});
		return { saved: true };
	},

	deleteDebt: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		await updateState((state) => {
			state.debts = state.debts.filter((d) => d.id !== id);
		});
		return { deleted: true };
	},

	savePlan: async ({ request }) => {
		const form = await request.formData();
		const monthly = num(form, 'monthly');
		const strategy = form.get('strategy') === 'snowball' ? 'snowball' : 'avalanche';
		if (isNaN(monthly) || monthly < 0) return fail(400, { message: 'Monthly amount must be a number.' });

		await updateState((state) => {
			state.payoff = { monthly, strategy };
		});
		return { saved: true };
	}
};
