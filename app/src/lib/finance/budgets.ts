import type { AppState, NecessityTag } from './types';
import { detectRecurringIncome } from './recurring';

export interface CategoryBudgetRow {
	category: string;
	allocated: number;
	actual: number;
	remaining: number;
	isSinkingFund: boolean;
	isExplicit: boolean; // false = allocated is a computed default (sinking fund), not a saved Budget row
}

function monthOf(date: string): string {
	return date.slice(0, 7);
}

// Every category with a rule, seen in that month's transactions, already
// budgeted that month, or carrying a sinking fund — so a quiet category
// doesn't vanish from the decision, and a sinking fund still shows up even
// before its first real transaction.
function relevantCategories(state: AppState, month: string): Set<string> {
	const categories = new Set<string>();
	for (const r of state.rules) categories.add(r.category);
	for (const t of state.transactions) if (monthOf(t.date) === month) categories.add(t.category);
	for (const b of state.budgets) if (b.month === month) categories.add(b.category);
	for (const cat of Object.keys(state.sinkingFunds)) categories.add(cat);
	return categories;
}

export function isExplicitBudget(state: AppState, month: string, category: string): boolean {
	return state.budgets.some((b) => b.month === month && b.category === category);
}

// Falls back to a sinking fund's annualTarget/12 when no explicit Budget row
// exists for this month yet — a standing default, not a one-time seed.
// Setting a real Budget row for a month always wins over the sinking fund.
export function getBudget(state: AppState, month: string, category: string): number {
	const explicit = state.budgets.find((b) => b.month === month && b.category === category);
	if (explicit) return explicit.allocated;
	const annual = state.sinkingFunds[category];
	if (annual) return Math.round(annual / 12);
	return 0;
}

export function setBudget(state: AppState, month: string, category: string, allocated: number): void {
	const existing = state.budgets.find((b) => b.month === month && b.category === category);
	if (existing) {
		existing.allocated = allocated;
	} else {
		state.budgets.push({ month, category, allocated });
	}
}

// Moves allocation between two categories in the same month — "roll with
// the punches": overspending one category isn't a failure state, it's a
// signal to take the difference from somewhere else. Net zero change to
// unallocated().
export function coverOverspend(state: AppState, month: string, fromCategory: string, toCategory: string, amount: number): void {
	setBudget(state, month, fromCategory, getBudget(state, month, fromCategory) - amount);
	setBudget(state, month, toCategory, getBudget(state, month, toCategory) + amount);
}

export function getSinkingFund(state: AppState, category: string): number | null {
	return state.sinkingFunds[category] ?? null;
}

// annualTarget <= 0 clears the sinking fund (category goes back to a plain,
// manually-budgeted category with no standing monthly default).
export function setSinkingFund(state: AppState, category: string, annualTarget: number): void {
	if (annualTarget > 0) {
		state.sinkingFunds[category] = annualTarget;
	} else {
		delete state.sinkingFunds[category];
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

// Falls back to the detected typical/recurring pay pattern when this
// month's actual deposits are still $0 (e.g. planning ahead of a paycheck
// that hasn't landed yet) — the whole point of detecting pay cadence.
export function estimatedMonthlyIncome(state: AppState, month: string): number {
	const actual = totalIncome(state, month);
	if (actual > 0) return actual;
	return detectRecurringIncome(state.transactions).reduce((sum, g) => sum + g.monthlyEquivalent, 0);
}

export function budgetRows(state: AppState, month: string): CategoryBudgetRow[] {
	const categories = relevantCategories(state, month);

	return Array.from(categories)
		.sort()
		.map((category) => {
			const allocated = getBudget(state, month, category);
			const actual = actualForCategory(state, month, category);
			return {
				category,
				allocated,
				actual,
				remaining: allocated - actual,
				isSinkingFund: category in state.sinkingFunds,
				isExplicit: isExplicitBudget(state, month, category)
			};
		});
}

export function unallocated(state: AppState, month: string): number {
	const income = totalIncome(state, month);
	const categories = relevantCategories(state, month);
	const allocatedSum = Array.from(categories).reduce((sum, cat) => sum + getBudget(state, month, cat), 0);
	return income - allocatedSum;
}

function pastMonthsWithData(state: AppState, month: string, maxCount: number): string[] {
	const months = new Set<string>();
	for (const t of state.transactions) {
		const m = monthOf(t.date);
		if (m < month) months.add(m);
	}
	return Array.from(months)
		.sort((a, b) => b.localeCompare(a))
		.slice(0, maxCount);
}

function averageActual(state: AppState, category: string, months: string[]): number {
	if (months.length === 0) return 0;
	const total = months.reduce((sum, m) => sum + actualForCategory(state, m, category), 0);
	return total / months.length;
}

// Suggests a starting allocation per category from trailing spend history,
// prioritizing essential categories fully and scaling discretionary/wasteful
// categories down to fit whatever's left of income after essentials —
// "needs before wants," using the necessity tags already on the categories.
// Does not write anything; callers decide which categories to actually
// apply it to (typically: only ones without an explicit Budget row yet, so
// it never clobbers a manual edit).
export function suggestBudget(state: AppState, month: string, lookbackMonths = 3): Record<string, number> {
	const months = pastMonthsWithData(state, month, lookbackMonths);

	const categories = new Set<string>();
	for (const r of state.rules) categories.add(r.category);
	for (const m of months) {
		for (const t of state.transactions) if (monthOf(t.date) === m) categories.add(t.category);
	}
	categories.delete('Transfer');
	categories.delete('Income');

	const averages = new Map<string, number>();
	for (const cat of categories) averages.set(cat, averageActual(state, cat, months));

	const essential: string[] = [];
	const rest: string[] = [];
	for (const cat of categories) {
		const tag: NecessityTag = state.categoryTags[cat] ?? 'discretionary';
		(tag === 'essential' ? essential : rest).push(cat);
	}

	const income = estimatedMonthlyIncome(state, month);
	const essentialTotal = essential.reduce((sum, c) => sum + (averages.get(c) ?? 0), 0);
	// Essentials get their full historical average regardless — shrinking a
	// necessity to force a fit would just hide a real shortfall, not solve it.
	const remainingForRest = income - essentialTotal;
	const restTotal = rest.reduce((sum, c) => sum + (averages.get(c) ?? 0), 0);
	const scale = remainingForRest > 0 && restTotal > 0 ? Math.min(1, remainingForRest / restTotal) : 0;

	const suggestion: Record<string, number> = {};
	for (const cat of essential) suggestion[cat] = Math.round(averages.get(cat) ?? 0);
	for (const cat of rest) suggestion[cat] = Math.round((averages.get(cat) ?? 0) * scale);
	return suggestion;
}
