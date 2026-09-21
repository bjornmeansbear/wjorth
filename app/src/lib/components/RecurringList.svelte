<script lang="ts">
	import type { RecurringGroup } from '$lib/finance/recurring';
	import type { NecessityTag } from '$lib/finance/types';
	import { fmtMoney } from '$lib/finance/amounts';
	import { effectiveTag } from '$lib/finance/tags';
	import TagPill from './TagPill.svelte';

	let { groups, categoryTags }: { groups: RecurringGroup[]; categoryTags: Record<string, NecessityTag> } = $props();
</script>

<div class="panel">
	<div class="panel-header">Recurring charges</div>
	<div class="panel-body">
		{#if groups.length === 0}
			<p class="caption-muted">Nothing recurring detected yet — needs at least two similarly-timed charges.</p>
		{:else}
			<table class="w-full text-sm">
				<thead>
					<tr class="label-upper text-left">
						<th class="pb-2 px-2">Merchant</th>
						<th class="pb-2 px-2">Avg</th>
						<th class="pb-2 px-2">Annual</th>
						<th class="pb-2 px-2">Necessity</th>
					</tr>
				</thead>
				<tbody>
					{#each groups as g}
						<tr class="border-t border-border">
							<td class="py-2 px-2">{g.merchant}</td>
							<td class="py-2 px-2 font-mono">{fmtMoney(g.avg)}</td>
							<td class="py-2 px-2 font-mono font-bold">{fmtMoney(g.annual)}</td>
							<td class="py-2 px-2">
								<TagPill tag={effectiveTag(g.transactions[0], categoryTags)} />
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
