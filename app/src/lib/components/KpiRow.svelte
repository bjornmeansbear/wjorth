<script lang="ts">
	import { fmtMoney } from '$lib/finance/amounts';
	import type { Kpis } from '$lib/finance/kpis';

	let { kpis }: { kpis: Kpis } = $props();
</script>

<div class="grid grid-cols-2 tablet:grid-cols-4 gap-4">
	<div class="panel p-4">
		<div class="label-upper">Spent</div>
		<div class="font-mono text-lg" style="font-variant-numeric: tabular-nums;">{fmtMoney(kpis.totalSpent)}</div>
	</div>
	<div class="panel p-4">
		<div class="label-upper">Income</div>
		<div class="font-mono text-lg" style="font-variant-numeric: tabular-nums;">{fmtMoney(kpis.totalIncome)}</div>
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
	</div>
	<div class="panel p-4">
		<div class="label-upper">Top category</div>
		<div class="text-lg">{kpis.topCategory ?? '—'}</div>
		{#if kpis.topCategory}
			<div class="caption-muted font-mono">{fmtMoney(kpis.topCategoryAmount)}</div>
		{/if}
	</div>
</div>
