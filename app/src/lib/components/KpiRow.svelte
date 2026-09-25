<script lang="ts">
	import { fmtMoney } from '$lib/finance/amounts';
	import type { Kpis } from '$lib/finance/kpis';

	let { kpis }: { kpis: Kpis } = $props();

	let hasOneOffs = $derived(kpis.oneOffSpent > 0 || kpis.oneOffIncome > 0);
	let netWithout = $derived(kpis.net - kpis.oneOffIncome + kpis.oneOffSpent);
</script>

<div class="grid grid-cols-2 tablet:grid-cols-4 gap-4">
	<div class="panel p-4">
		<div class="label-upper">Spent</div>
		<div class="font-mono text-lg" style="font-variant-numeric: tabular-nums;">{fmtMoney(kpis.totalSpent)}</div>
		{#if hasOneOffs}
			<div class="caption-muted font-mono">{fmtMoney(kpis.totalSpent - kpis.oneOffSpent)} without one-offs</div>
		{/if}
	</div>
	<div class="panel p-4">
		<div class="label-upper">Income</div>
		<div class="font-mono text-lg" style="font-variant-numeric: tabular-nums;">{fmtMoney(kpis.totalIncome)}</div>
		{#if hasOneOffs}
			<div class="caption-muted font-mono">{fmtMoney(kpis.totalIncome - kpis.oneOffIncome)} without one-offs</div>
		{/if}
	</div>
	<div class="panel p-4">
		<div class="label-upper">Net</div>
		<div
			class="font-mono text-lg"
			class:text-success={kpis.net >= 0}
			class:text-danger={kpis.net < 0}
			style="font-variant-numeric: tabular-nums;"
		>
			{fmtMoney(kpis.net)}
		</div>
		{#if hasOneOffs}
			<div class="caption-muted font-mono">{fmtMoney(netWithout)} without one-offs</div>
		{/if}
	</div>
	<div class="panel p-4">
		<div class="label-upper">Top category</div>
		<div class="text-lg">{kpis.topCategory ?? '—'}</div>
		{#if kpis.topCategory}
			<div class="caption-muted font-mono">{fmtMoney(kpis.topCategoryAmount)}</div>
		{/if}
	</div>
</div>
