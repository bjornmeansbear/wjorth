<script lang="ts">
	import { fmtMoney } from '$lib/finance/amounts';

	let { unallocated, income }: { unallocated: number; income: number } = $props();

	let nearZero = $derived(Math.abs(unallocated) < 5);
</script>

<div
	class="panel p-6 text-center"
	class:border-danger={unallocated < 0 && !nearZero}
>
	{#if nearZero}
		<p class="text-lg">Every dollar of income (<span class="font-mono">{fmtMoney(income)}</span>) is assigned. On track.</p>
	{:else if unallocated > 0}
		<p class="text-lg">
			<span class="font-mono font-bold">{fmtMoney(unallocated)}</span> not yet assigned — give it a category below.
		</p>
	{:else}
		<p class="text-lg text-danger">
			<span class="font-mono font-bold">{fmtMoney(Math.abs(unallocated))}</span> over-assigned — take it from somewhere else.
		</p>
	{/if}
</div>
