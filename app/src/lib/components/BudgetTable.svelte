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
					<th class="pb-2">Category</th>
					<th class="pb-2">Necessity</th>
					<th class="pb-2 text-right">Allocated</th>
					<th class="pb-2 text-right">Actual</th>
					<th class="pb-2 text-right">Remaining</th>
					<th class="pb-2">Progress</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					{@const pct = row.allocated > 0 ? Math.min(100, (row.actual / row.allocated) * 100) : row.actual > 0 ? 100 : 0}
					{@const over = row.actual > row.allocated}
					<tr class="border-t border-border">
						<td class="py-2">{row.category}</td>
						<td class="py-2"><TagPill tag={categoryTags[row.category] ?? 'discretionary'} /></td>
						<td class="py-2 text-right">
							<form method="POST" action="?/setBudget" use:enhance>
								<input type="hidden" name="month" value={monthStr} />
								<input type="hidden" name="category" value={row.category} />
								<input
									class="btn w-24 text-right font-mono"
									type="number"
									step="1"
									name="allocated"
									value={row.allocated}
									onblur={(e) => (e.currentTarget as HTMLInputElement).form?.requestSubmit()}
								/>
							</form>
						</td>
						<td class="py-2 text-right font-mono">{fmtMoney(row.actual)}</td>
						<td class="py-2 text-right font-mono" class:text-danger={row.remaining < 0}>{fmtMoney(row.remaining)}</td>
						<td class="py-2 w-32">
							<div class="h-2 bg-border/20 border border-border">
								<div
									class="h-full"
									class:bg-danger={over}
									class:bg-accent={!over}
									style="width: {pct}%"
								></div>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
