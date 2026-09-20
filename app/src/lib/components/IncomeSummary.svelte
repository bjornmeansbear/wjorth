<script lang="ts">
	import type { PayGroup } from '$lib/finance/recurring';
	import { fmtMoney } from '$lib/finance/amounts';

	let {
		actualIncome,
		estimatedIncome,
		payGroups
	}: { actualIncome: number; estimatedIncome: number; payGroups: PayGroup[] } = $props();
</script>

<div class="panel">
	<div class="panel-header">Monthly pay</div>
	<div class="panel-body grid tablet:grid-cols-2 gap-4">
		<div>
			<div class="label-upper">This month, actual</div>
			<div class="font-mono text-xl">{fmtMoney(actualIncome)}</div>
			<p class="caption-muted">Deposits that have actually landed so far this month.</p>
		</div>
		<div>
			<div class="label-upper">Typical / expected</div>
			<div class="font-mono text-xl">{fmtMoney(estimatedIncome)}</div>
			{#if payGroups.length > 0}
				<p class="caption-muted">
					Detected from your pay history:
					{#each payGroups as g, i}{i > 0 ? '; ' : ''}<span class="font-mono">{fmtMoney(g.avgAmount)}</span> every ~{Math.round(
							g.avgIntervalDays
						)} days from {g.source}{/each}. Use this figure to plan a budget before this month's paychecks
					have all landed.
				</p>
			{:else}
				<p class="caption-muted">Not enough pay history yet to detect a pattern — needs at least two similarly-sized deposits.</p>
			{/if}
		</div>
	</div>
</div>
