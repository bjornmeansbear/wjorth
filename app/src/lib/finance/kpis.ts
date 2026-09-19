import type { Transaction } from './types';

export interface Kpis {
	totalSpent: number;
	totalIncome: number;
	net: number;
	topCategory: string | null;
	topCategoryAmount: number;
}

// Ported from v1's renderKPIs. Transfers are fully excluded from all sums.
// "Top category" is computed purely from outflow spend — income never
// populates the category breakdown.
export function computeKpis(transactions: Transaction[]): Kpis {
	let totalSpent = 0;
	let totalIncome = 0;
	const byCat = new Map<string, number>();

	for (const t of transactions) {
		if (t.category === 'Transfer') continue;
		if (t.flow === 'out') {
			totalSpent += t.amount;
			byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
		} else {
			totalIncome += t.amount;
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

	return { totalSpent, totalIncome, net: totalIncome - totalSpent, topCategory, topCategoryAmount };
}
