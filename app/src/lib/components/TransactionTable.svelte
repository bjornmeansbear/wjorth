<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Transaction, NecessityTag } from '$lib/finance/types';
	import { fmtMoney } from '$lib/finance/amounts';
	import { effectiveTag } from '$lib/finance/tags';
	import { isWjerk } from '$lib/finance/wjerk';
	import { stableColorMap } from '$lib/finance/chartTheme';
	import TagPill from './TagPill.svelte';

	let {
		transactions,
		categories,
		categoryTags,
		accounts,
		wjerkMerchants
	}: {
		transactions: Transaction[];
		categories: string[];
		categoryTags: Record<string, NecessityTag>;
		accounts: string[];
		wjerkMerchants: string[];
	} = $props();

	// Same stable mapping the category chart uses, so a category's color
	// means the same thing in both places. Accounts get their own
	// independent map (same function, different input list) so an
	// account's color never collides with a category's.
	let categoryColors = $derived(stableColorMap(categories));
	let accountColors = $derived(stableColorMap(accounts));

	type SortCol = 'date' | 'description' | 'account' | 'category' | 'amount';
	type PageSize = 50 | 100 | 200 | 500 | 'all';

	let sortCol = $state<SortCol>('date');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let search = $state('');
	let categoryFilter = $state('');
	let wjerkOnly = $state(false);
	let pageSize = $state<PageSize>(100);
	let page = $state(0);

	let filtered = $derived(
		transactions
			.filter((t) => !search || t.description.toLowerCase().includes(search.toLowerCase()))
			.filter((t) => !categoryFilter || t.category === categoryFilter)
			.filter((t) => !wjerkOnly || isWjerk(t, wjerkMerchants))
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

	let effectivePageSize = $derived(pageSize === 'all' ? Math.max(filtered.length, 1) : pageSize);
	let totalPages = $derived(Math.max(1, Math.ceil(filtered.length / effectivePageSize)));

	// Reset to page 1 whenever the underlying result set changes shape —
	// otherwise a filter/search/page-size change can strand you on a now-empty
	// page 5 of a 2-page result.
	$effect(() => {
		search;
		categoryFilter;
		wjerkOnly;
		sortCol;
		sortDir;
		pageSize;
		page = 0;
	});

	let visible = $derived(filtered.slice(page * effectivePageSize, (page + 1) * effectivePageSize));

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
		<div class="flex flex-wrap items-center gap-2">
			<input class="field" type="search" placeholder="Search description…" bind:value={search} />
			<select class="field" bind:value={categoryFilter}>
				<option value="">All categories</option>
				{#each categories as c}
					<option value={c}>{c}</option>
				{/each}
			</select>
			<label class="flex items-center gap-1 text-sm">
				<input type="checkbox" bind:checked={wjerkOnly} />
				Wjerk only
			</label>
		</div>
	</div>
	<div class="panel-body">
		<div class="-mx-5 overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="label-upper text-left">
					<th class="pb-2 px-2 cursor-pointer" onclick={() => toggleSort('date')}>Date</th>
					<th class="pb-2 px-2 cursor-pointer" onclick={() => toggleSort('description')}>Description</th>
					<th class="pb-2 px-2 cursor-pointer" onclick={() => toggleSort('account')}>Account</th>
					<th class="pb-2 px-2 cursor-pointer" onclick={() => toggleSort('category')}>Category</th>
					<th class="pb-2 px-2">Necessity</th>
					<th class="pb-2 px-2 cursor-pointer text-right" onclick={() => toggleSort('amount')}>Amount</th>
					<th class="pb-2 px-2" title="One-off: a capital purchase (a car, an appliance) or the one-time money that paid for it — excluded from budget-suggestion averages and shown separately in the totals">Major?</th>
					<th class="pb-2 px-2" title="Wjerk business expense or income — included in the accountant export">Wjerk</th>
				</tr>
			</thead>
			<tbody>
				{#each visible as t (t.id)}
					<tr class="border-t border-border">
						<td class="py-2 px-2 font-mono whitespace-nowrap text-text-muted">{t.date}</td>
						<td class="py-2 px-2">{t.description}</td>
						<td class="py-2 px-2 max-w-24">
							<span class="flex items-center gap-1.5" title={t.account}>
								<span
									class="inline-block w-2.5 h-2.5 shrink-0 rounded-full"
									style="background-color: {accountColors[t.account] ?? 'transparent'}"
								></span>
								<span class="truncate">{t.account}</span>
							</span>
						</td>
						<td class="py-2 px-2">
							<form method="POST" action="?/editCategory" use:enhance class="flex items-center gap-2">
								<input type="hidden" name="transactionId" value={t.id} />
								<span
									class="inline-block w-2.5 h-2.5 shrink-0 rounded-full"
									style="background-color: {categoryColors[t.category] ?? 'transparent'}"
									title={t.category}
								></span>
								<select
									name="category"
									class="field w-40"
									value={t.category}
									onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}
								>
									{#each categories as c}
										<option value={c}>{c}</option>
									{/each}
								</select>
							</form>
						</td>
						<td class="py-2 px-2">
							<form method="POST" action="?/setTransactionTag" use:enhance>
								<input type="hidden" name="transactionId" value={t.id} />
								<select
									name="tag"
									class="field w-40"
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
						<td class="py-2 px-2 text-right font-mono" class:text-danger={t.flow === 'out'} class:text-success={t.flow === 'in'}>
							{t.flow === 'out' ? '-' : ''}{fmtMoney(t.amount)}
						</td>
						<td class="py-2 px-2 text-center">
							<form method="POST" action="?/setMajorPurchase" use:enhance>
								<input type="hidden" name="transactionId" value={t.id} />
								<input
									type="checkbox"
									name="isMajorPurchase"
									checked={t.isMajorPurchase}
									aria-label="Major purchase: {t.description}"
									onchange={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()}
								/>
							</form>
						</td>
						<td class="py-2 px-2 text-center">
							<form method="POST" action="?/setWjerk" use:enhance>
								<input type="hidden" name="transactionId" value={t.id} />
								<input
									type="checkbox"
									name="wjerk"
									checked={isWjerk(t, wjerkMerchants)}
									aria-label="Wjerk: {t.description}"
									title={t.wjerk === null ? 'Merchant default' : 'Set on this transaction'}
									onchange={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()}
								/>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-4 mt-4">
			<p class="caption-muted">
				Showing {visible.length} of {filtered.length} transactions
				{#if totalPages > 1}(page {page + 1} of {totalPages}){/if}
			</p>
			<div class="flex items-center gap-2">
				<label class="caption-muted flex items-center gap-1">
					Show
					<select class="field" bind:value={pageSize}>
						<option value={50}>50</option>
						<option value={100}>100</option>
						<option value={200}>200</option>
						<option value={500}>500</option>
						<option value="all">All</option>
					</select>
				</label>
				<button type="button" class="btn" disabled={page === 0} onclick={() => (page -= 1)}>‹ Prev</button>
				<button type="button" class="btn" disabled={page >= totalPages - 1} onclick={() => (page += 1)}>Next ›</button>
			</div>
		</div>
	</div>
</div>
