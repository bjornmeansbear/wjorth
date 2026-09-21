<script lang="ts">
	import { enhance } from '$app/forms';
	import { fmtMoney } from '$lib/finance/amounts';

	let { sinkingFunds, categories }: { sinkingFunds: Record<string, number>; categories: string[] } = $props();

	let newCategory = $state(categories[0] ?? '');
	let newAnnual = $state(0);
</script>

<details class="panel">
	<summary class="panel-header cursor-pointer">Sinking funds (irregular costs)</summary>
	<div class="panel-body">
		<p class="caption-muted mb-4">
			For costs that hit once or twice a year, not every month — an annual insurance premium, car
			maintenance, holiday spending. Set the yearly amount and Wjorth spreads it into a monthly
			allocation automatically, so it counts as "assigned" every month instead of blowing up your
			budget the one month it's actually due.
		</p>

		<form method="POST" action="?/setSinkingFund" use:enhance class="flex gap-2 mb-4 flex-wrap items-end">
			<label class="text-sm">
				Category
				<input class="field" name="category" bind:value={newCategory} required />
			</label>
			<label class="text-sm">
				Annual target
				<input class="field w-32" type="number" step="1" name="annualTarget" bind:value={newAnnual} required />
			</label>
			<button type="submit" class="btn btn-accent">Save</button>
		</form>

		{#if Object.keys(sinkingFunds).length === 0}
			<p class="caption-muted">No sinking funds set yet.</p>
		{:else}
			<ul class="text-sm space-y-2">
				{#each Object.entries(sinkingFunds).sort(([a], [b]) => a.localeCompare(b)) as [category, annual]}
					<li class="flex justify-between items-center border-t border-border pt-2">
						<span>{category}</span>
						<span class="font-mono"
							>{fmtMoney(annual)}/yr → {fmtMoney(Math.round(annual / 12))}/mo</span
						>
						<form method="POST" action="?/setSinkingFund" use:enhance>
							<input type="hidden" name="category" value={category} />
							<input type="hidden" name="annualTarget" value="0" />
							<button type="submit" class="btn">Clear</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</details>
