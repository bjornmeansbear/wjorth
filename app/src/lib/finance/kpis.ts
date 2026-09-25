import type { Transaction } from './types';

export interface Kpis {
	totalSpent: number;
	totalIncome: number;
	net: number;
	// Major-purchase-flagged amounts inside the totals above — a car and the
	// one-off deposit that paid for it inflate both Spent and Income while
	// barely moving Net, so the UI shows totals with and without them.
	oneOffSpent: number;
	oneOffIncome: number;
	topCategory: string | null;
	topCategoryAmount: number;
}

// Ported from v1's renderKPIs. Transfers are fully excluded from all sums.
// "Top category" is computed purely from outflow spend — income never
// populates the category breakdown.
export function computeKpis(transactions: Transaction[]): Kpis {
	let totalSpent = 0;
	let totalIncome = 0;
	let oneOffSpent = 0;
	let oneOffIncome = 0;
	const byCat = new Map<string, number>();

	for (const t of transactions) {
		if (t.category === 'Transfer') continue;
		if (t.flow === 'out') {
			totalSpent += t.amount;
			if (t.isMajorPurchase) oneOffSpent += t.amount;
			byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
		} else {
			totalIncome += t.amount;
			if (t.isMajorPurchase) oneOffIncome += t.amount;
		}
	}

	let topCategory: string | null = null;
	let topCategoryAmount = 0;
	for (const [cat, amt] of byCat) {
		if (amt > topCategoryAmount) {
			topCategory = cat;
			topCategoryAmount = amt;
		}
	}

	return {
		totalSpent,
		totalIncome,
		net: totalIncome - totalSpent,
		oneOffSpent,
		oneOffIncome,
		topCategory,
		topCategoryAmount
	};
}
