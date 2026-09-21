<script lang="ts">
	import { enhance } from '$app/forms';
	import type { CategoryBudgetRow } from '$lib/finance/budgets';
	import type { NecessityTag } from '$lib/finance/types';
	import { fmtMoney } from '$lib/finance/amounts';
	import TagPill from './TagPill.svelte';

	let { rows, month: monthStr, categoryTags }: { rows: CategoryBudgetRow[]; month: string; categoryTags: Record<string, NecessityTag> } = $props();
</script>

<div class="panel">
	<div class="panel-header">Budget for {monthStr}</div>
	<div class="panel-body overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="label-upper text-left">
					<th class="pb-2 px-2">Category</th>
					<th class="pb-2 px-2">Necessity</th>
					<th class="pb-2 px-2 text-right">Allocated</th>
					<th class="pb-2 px-2 text-right">Actual</th>
					<th class="pb-2 px-2 text-right">Remaining</th>
					<th class="pb-2 px-2">Progress</th>
					<th class="pb-2 px-2"></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					{@const pct = row.allocated > 0 ? Math.min(100, (row.actual / row.allocated) * 100) : row.actual > 0 ? 100 : 0}
					{@const over = row.actual > row.allocated}
					{@const coverOptions = rows.filter((r) => r.category !== row.category).sort((a, b) => b.remaining - a.remaining)}
					<tr class="border-t border-border">
						<td class="py-2 px-2">
							{row.category}
							{#if row.isSinkingFund}
								<span class="tag ml-1" title="Monthly amount comes from a sinking fund target">fund</span>
							{/if}
						</td>
						<td class="py-2 px-2"><TagPill tag={categoryTags[row.category] ?? 'discretionary'} /></td>
						<td class="py-2 px-2 text-right">
							<form method="POST" action="?/setBudget" use:enhance>
								<input type="hidden" name="month" value={monthStr} />
								<input type="hidden" name="category" value={row.category} />
								<input
									class="field w-24 text-right font-mono"
									type="number"
									step="1"
									name="allocated"
									value={row.allocated}
									onblur={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()}
								/>
							</form>
							{#if row.isSinkingFund && !row.isExplicit}
								<div class="caption-muted">auto, from fund</div>
							{/if}
						</td>
						<td class="py-2 px-2 text-right font-mono">{fmtMoney(row.actual)}</td>
						<td class="py-2 px-2 text-right font-mono" class:text-danger={row.remaining < 0}>{fmtMoney(row.remaining)}</td>
						<td class="py-2 px-2 w-32">
							<div class="h-2 bg-border/20 border border-border">
								<div
									class="h-full"
									class:bg-danger={over}
									class:bg-accent={!over}
									style="width: {pct}%"
								></div>
							</div>
						</td>
						<td class="py-2 px-2">
							{#if row.remaining < 0 && coverOptions.length > 0}
								<form method="POST" action="?/coverOverspend" use:enhance class="flex gap-1 items-center">
									<input type="hidden" name="month" value={monthStr} />
									<input type="hidden" name="toCategory" value={row.category} />
									<input type="hidden" name="amount" value={Math.abs(row.remaining)} />
									<span class="caption-muted whitespace-nowrap">cover from</span>
									<select name="fromCategory" class="field">
										{#each coverOptions as opt}
											<option value={opt.category}>{opt.category} ({fmtMoney(opt.remaining)})</option>
										{/each}
									</select>
									<button type="submit" class="btn">Cover</button>
								</form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
