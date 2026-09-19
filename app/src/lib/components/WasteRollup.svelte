<script lang="ts">
	import type { TagRollup } from '$lib/finance/tags';
	import { fmtMoney } from '$lib/finance/amounts';

	let { rollup }: { rollup: TagRollup } = $props();

	let total = $derived(rollup.essential + rollup.discretionary + rollup.wasteful || 1);
</script>

<div class="panel">
	<div class="panel-header">Spend by necessity</div>
	<div class="panel-body space-y-4">
		{#each [['essential', rollup.essential, ''], ['discretionary', rollup.discretionary, ''], ['wasteful', rollup.wasteful, 'text-danger']] as [label, amount, cls]}
			<div>
				<div class="flex justify-between text-sm mb-1">
					<span class="capitalize">{label}</span>
					<span class="font-mono {cls}">{fmtMoney(amount as number)}</span>
				</div>
				<div class="h-2 bg-border/20 border border-border">
					<div class="h-full {cls ? 'bg-danger' : 'bg-accent'}" style="width: {((amount as number) / total) * 100}%"></div>
				</div>
			</div>
		{/each}
	</div>
</div>
