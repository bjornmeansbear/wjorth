<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Transaction, NecessityTag } from '$lib/finance/types';
	import { fmtMoney } from '$lib/finance/amounts';
	import { effectiveTag } from '$lib/finance/tags';
	import TagPill from './TagPill.svelte';

	let {
		transactions,
		categories,
		categoryTags
	}: { transactions: Transaction[]; categories: string[]; categoryTags: Record<string, NecessityTag> } = $props();

	type SortCol = 'date' | 'description' | 'account' | 'category' | 'amount';
	let sortCol = $state<SortCol>('date');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let search = $state('');
	let categoryFilter = $state('');

	const MAX_ROWS = 200;

	let filtered = $derived(
		transactions
			.filter((t) => !search || t.description.toLowerCase().includes(search.toLowerCase()))
			.filter((t) => !categoryFilter || t.category === categoryFilter)
			.sort((a, b) => {
				let av: string | number = a[sortCol];
				let bv: string | number = b[sortCol];
				if (sortCol === 'amount') {
					av = a.flow === 'out' ? -a.amount : a.amount;
					bv = b.flow === 'out' ? -b.amount : b.amount;
				}
				const cmp = av < bv ? -1 : av > bv ? 1 : 0;
				return sortDir === 'asc' ? cmp : -cmp;
			})
	);

	let visible = $derived(filtered.slice(0, MAX_ROWS));

	function toggleSort(col: SortCol) {
		if (sortCol === col) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortCol = col;
			sortDir = 'desc';
		}
	}
</script>

<div class="panel">
	<div class="panel-header flex flex-wrap gap-4 items-center justify-between">
		<span>Transactions</span>
		<div class="flex gap-2">
			<input class="btn" type="search" placeholder="Search description…" bind:value={search} />
			<select class="btn" bind:value={categoryFilter}>
				<option value="">All categories</option>
				{#each categories as c}
					<option value={c}>{c}</option>
				{/each}
			</select>
		</div>
	</div>
	<div class="panel-body overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="label-upper text-left">
					<th class="pb-2 cursor-pointer" onclick={() => toggleSort('date')}>Date</th>
					<th class="pb-2 cursor-pointer" onclick={() => toggleSort('description')}>Description</th>
					<th class="pb-2 cursor-pointer" onclick={() => toggleSort('account')}>Account</th>
					<th class="pb-2 cursor-pointer" onclick={() => toggleSort('category')}>Category</th>
					<th class="pb-2">Necessity</th>
					<th class="pb-2 cursor-pointer text-right" onclick={() => toggleSort('amount')}>Amount</th>
				</tr>
			</thead>
			<tbody>
				{#each visible as t (t.id)}
					<tr class="border-t border-border">
						<td class="py-2 font-mono whitespace-nowrap">{t.date}</td>
						<td class="py-2">{t.description}</td>
						<td class="py-2">{t.account}</td>
						<td class="py-2">
							<form method="POST" action="?/editCategory" use:enhance>
								<input type="hidden" name="transactionId" value={t.id} />
								<select
									name="category"
									class="btn"
									value={t.category}
									onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}
								>
									{#each categories as c}
										<option value={c}>{c}</option>
									{/each}
								</select>
							</form>
						</td>
						<td class="py-2">
							<form method="POST" action="?/setTransactionTag" use:enhance>
								<input type="hidden" name="transactionId" value={t.id} />
								<select
									name="tag"
									class="btn"
									value={t.tag ?? ''}
									onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}
								>
									<option value="">(default: {categoryTags[t.category] ?? 'discretionary'})</option>
									<option value="essential">essential</option>
									<option value="discretionary">discretionary</option>
									<option value="wasteful">wasteful</option>
								</select>
							</form>
						</td>
						<td class="py-2 text-right font-mono" class:text-danger={t.flow === 'out'} class:text-success={t.flow === 'in'}>
							{t.flow === 'out' ? '-' : ''}{fmtMoney(t.amount)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<p class="caption-muted mt-4">
			Showing {visible.length} of {filtered.length} transactions{filtered.length > MAX_ROWS
				? ' — narrow with search or filter to see more.'
				: '.'}
		</p>
	</div>
</div>
