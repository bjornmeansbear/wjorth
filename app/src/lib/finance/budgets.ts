import type { AppState, Budget } from './types';

export interface CategoryBudgetRow {
	category: string;
	allocated: number;
	actual: number;
	remaining: number;
}

function monthOf(date: string): string {
	return date.slice(0, 7);
}

export function getBudget(state: AppState, month: string, category: string): number {
	return state.budgets.find((b) => b.month === month && b.category === category)?.allocated ?? 0;
}

export function setBudget(state: AppState, month: string, category: string, allocated: number): void {
	const existing = state.budgets.find((b) => b.month === month && b.category === category);
	if (existing) {
		existing.allocated = allocated;
	} else {
		state.budgets.push({ month, category, allocated });
	}
}

// actual() matches v1's KPI convention: outflow-only, Transfer excluded.
export function actualForCategory(state: AppState, month: string, category: string): number {
	let sum = 0;
	for (const t of state.transactions) {
		if (t.flow === 'out' && t.category === category && t.category !== 'Transfer' && monthOf(t.date) === month) {
			sum += t.amount;
		}
	}
	return sum;
}

export function totalIncome(state: AppState, month: string): number {
	let sum = 0;
	for (const t of state.transactions) {
		if (t.flow === 'in' && t.category !== 'Transfer' && monthOf(t.date) === month) sum += t.amount;
	}
	return sum;
}

// Union of: every category with a rule, every category seen in that month's
// transactions, and every category already budgeted — so a quiet category
// doesn't vanish from the decision just because nothing happened in it.
export function budgetRows(state: AppState, month: string): CategoryBudgetRow[] {
	const categories = new Set<string>();
	for (const r of state.rules) categories.add(r.category);
	for (const t of state.transactions) if (monthOf(t.date) === month) categories.add(t.category);
	for (const b of state.budgets) if (b.month === month) categories.add(b.category);

	return Array.from(categories)
		.sort()
		.map((category) => {
			const allocated = getBudget(state, month, category);
			const actual = actualForCategory(state, month, category);
			return { category, allocated, actual, remaining: allocated - actual };
		});
}

export function unallocated(state: AppState, month: string): number {
	const income = totalIncome(state, month);
	const allocatedSum = state.budgets
		.filter((b: Budget) => b.month === month)
		.reduce((sum, b) => sum + b.allocated, 0);
	return income - allocatedSum;
}
