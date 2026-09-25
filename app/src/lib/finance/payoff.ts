import type { AppState, Debt } from './types';

export type PayoffStrategy = 'avalanche' | 'snowball';

export interface DebtResult {
	id: string;
	name: string;
	month: number | null; // months from now until paid off; null = not within the horizon
	interest: number;
}

export interface PayoffResult {
	months: number | null; // null = never paid off within the horizon
	totalInterest: number;
	totalPaid: number;
	perDebt: DebtResult[];
	// Sum of all balances at the end of each month, starting with today at
	// index 0 — enough to draw a debt-free curve later without re-simulating.
	balances: number[];
	shortfall: number; // how far the monthly amount falls below the minimums (0 if it covers them)
}

// 50 years. Past this, "never" is the honest answer — it means the payment
// barely covers (or doesn't cover) the interest.
const HORIZON_MONTHS = 600;

function monthlyRate(debt: Debt, month: number): number {
	const apr = debt.promoApr !== null && month <= debt.promoMonths ? debt.promoApr : debt.apr;
	return apr / 100 / 12;
}

// Month-by-month simulation with interest accruing before payment, the way
// card statements work. Each month: every debt gets its minimum (or its
// remaining balance, if smaller); whatever's left of `monthly` goes to one
// target at a time in strategy order. When a debt is paid off, its minimum
// rolls into the pool — that rollover is what makes a payoff plan beat
// paying minimums forever. `rollover: false` models exactly that
// "minimums forever" baseline: each debt gets its fixed minimum and nothing
// else, even after other debts are gone.
export function simulatePayoff(
	debts: Debt[],
	monthly: number,
	strategy: PayoffStrategy,
	{ rollover = true }: { rollover?: boolean } = {}
): PayoffResult {
	const active = debts.filter((d) => d.balance > 0);
	const bal = new Map(active.map((d) => [d.id, d.balance]));
	const interest = new Map(active.map((d) => [d.id, 0]));
	const paidOffAt = new Map<string, number>();
	const minTotal = active.reduce((s, d) => s + d.minPayment, 0);
	const budget = rollover ? Math.max(monthly, minTotal) : minTotal;

	let totalInterest = 0;
	let totalPaid = 0;
	const balances = [active.reduce((s, d) => s + d.balance, 0)];
	let month = 0;

	while (paidOffAt.size < active.length && month < HORIZON_MONTHS) {
		month++;
		const open = active.filter((d) => !paidOffAt.has(d.id));

		for (const d of open) {
			const i = bal.get(d.id)! * monthlyRate(d, month);
			bal.set(d.id, bal.get(d.id)! + i);
			interest.set(d.id, interest.get(d.id)! + i);
			totalInterest += i;
		}

		let pool = budget;
		const pay = (d: Debt, amount: number) => {
			const amt = Math.min(amount, bal.get(d.id)!, pool);
			bal.set(d.id, bal.get(d.id)! - amt);
			pool -= amt;
			totalPaid += amt;
		};

		for (const d of open) pay(d, d.minPayment);

		if (rollover) {
			const order = [...open].sort((a, b) =>
				strategy === 'avalanche'
					? monthlyRate(b, month) - monthlyRate(a, month) || bal.get(a.id)! - bal.get(b.id)!
					: bal.get(a.id)! - bal.get(b.id)!
			);
			for (const d of order) {
				if (pool <= 0) break;
				pay(d, pool);
			}
		}

		for (const d of open) {
			// Half a cent: float dust from repeated interest math shouldn't keep
			// a debt "open" for an extra month.
			if (bal.get(d.id)! < 0.005) paidOffAt.set(d.id, month);
		}
		balances.push([...bal.values()].reduce((s, b) => s + Math.max(b, 0), 0));
	}

	const done = paidOffAt.size === active.length;
	return {
		months: done ? month : null,
		totalInterest,
		totalPaid,
		perDebt: active
			.map((d) => ({ id: d.id, name: d.name, month: paidOffAt.get(d.id) ?? null, interest: interest.get(d.id)! }))
			.sort((a, b) => (a.month ?? Infinity) - (b.month ?? Infinity)),
		balances,
		shortfall: Math.max(0, minTotal - monthly)
	};
}

export interface TransferOffer {
	feePct: number; // one-time fee, added to the transferred balance
	promoApr: number; // usually 0
	promoMonths: number;
	aprAfter: number;
}

// What-if: the chosen debts move onto one new promo card. The new card's
// minimum is the moved debts' minimums combined — i.e. you keep paying what
// you were paying, which is the realistic plan, rather than the new card's
// (lower) contractual minimum.
export function withBalanceTransfer(debts: Debt[], moveIds: string[], offer: TransferOffer): Debt[] {
	const moving = debts.filter((d) => moveIds.includes(d.id) && d.balance > 0);
	if (moving.length === 0) return debts;
	const moved = moving.reduce((s, d) => s + d.balance, 0);
	return [
		...debts.filter((d) => !moving.includes(d)),
		{
			id: 'transfer',
			name: 'Balance transfer card',
			account: null,
			balance: moved * (1 + offer.feePct / 100),
			apr: offer.aprAfter,
			minPayment: moving.reduce((s, d) => s + d.minPayment, 0),
			promoApr: offer.promoApr,
			promoMonths: offer.promoMonths
		}
	];
}

export interface CardHistory {
	account: string;
	months: number; // how many recent months the averages cover
	avgInterest: number;
	avgPayment: number;
}

// Recent reality from the imported statements, per card account: average
// monthly interest charged and average monthly payment received (Transfer
// inflows on the card side) over the last `lookback` months that had any
// interest. Used to sanity-check typed-in balances/APRs and to suggest a
// realistic starting monthly amount — not as inputs to the simulation.
export function cardHistory(state: AppState, lookback = 3): CardHistory[] {
	const accounts = new Set(state.transactions.filter((t) => t.category === 'Interest').map((t) => t.account));
	return Array.from(accounts)
		.map((account) => {
			const txns = state.transactions.filter((t) => t.account === account);
			const months = Array.from(new Set(txns.filter((t) => t.category === 'Interest').map((t) => t.date.slice(0, 7))))
				.sort()
				.slice(-lookback);
			const inMonths = txns.filter((t) => months.includes(t.date.slice(0, 7)));
			const sum = (pred: (t: (typeof txns)[number]) => boolean) =>
				inMonths.filter(pred).reduce((s, t) => s + t.amount, 0);
			return {
				account,
				months: months.length,
				avgInterest: sum((t) => t.category === 'Interest' && t.flow === 'out') / months.length,
				avgPayment: sum((t) => t.category === 'Transfer' && t.flow === 'in') / months.length
			};
		})
		.sort((a, b) => b.avgInterest - a.avgInterest);
}
