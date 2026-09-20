<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import UnallocatedBanner from '$lib/components/UnallocatedBanner.svelte';
	import BudgetTable from '$lib/components/BudgetTable.svelte';
	import IncomeSummary from '$lib/components/IncomeSummary.svelte';
	import SinkingFundsPanel from '$lib/components/SinkingFundsPanel.svelte';

	let { data }: PageProps = $props();

	let suggestResult = $state<{ applied: number } | null>(null);

	function shiftMonth(delta: number) {
		const [y, m] = data.month.split('-').map(Number);
		const d = new Date(y, m - 1 + delta, 1);
		const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		window.location.href = `/budget?month=${next}`;
	}
</script>

<div class="max-w-5xl mx-auto p-6 space-y-6">
	<div class="flex flex-wrap justify-between items-center gap-4">
		<h1>Budget</h1>
		<div class="flex gap-2 items-center">
			<a href="/" class="btn">← Dashboard</a>
			<button type="button" class="btn" onclick={() => shiftMonth(-1)}>‹</button>
			<span class="font-mono">{data.month}</span>
			<button type="button" class="btn" onclick={() => shiftMonth(1)}>›</button>
		</div>
	</div>

	<details class="panel">
		<summary class="panel-header cursor-pointer">What is zero-based budgeting?</summary>
		<div class="panel-body">
			<p>
				Give every dollar of income a job — a category, a savings goal, a debt payment — until
				nothing's left unassigned. The banner below tracks that number; it should sit near $0.
			</p>
			<p class="mb-0">
				It's not about sticking to the plan perfectly. If one category runs over, the normal
				response is to move money from a category with room to spare, not to treat the month as a
				failure — that's what the "cover from" control on an overspent row is for.
			</p>
		</div>
	</details>

	<IncomeSummary actualIncome={data.actualIncome} estimatedIncome={data.estimatedIncome} payGroups={data.payGroups} />
	<UnallocatedBanner unallocated={data.unallocated} income={data.actualIncome} />

	{#if suggestResult}
		<p class="caption-muted">Filled in {suggestResult.applied} category{suggestResult.applied === 1 ? '' : 'ies'} from your spending history.</p>
	{/if}
	<form
		method="POST"
		action="?/applySuggestedBudget"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success' && result.data) {
					suggestResult = { applied: result.data.applied as number };
				}
			};
		}}
	>
		<input type="hidden" name="month" value={data.month} />
		<button type="submit" class="btn btn-accent"
			>Suggest a starting budget from history</button
		>
		<span class="caption-muted">Fills in categories you haven't budgeted yet this month — never overwrites one you've already set.</span>
	</form>

	<BudgetTable rows={data.rows} month={data.month} categoryTags={data.categoryTags} />

	<SinkingFundsPanel sinkingFunds={data.sinkingFunds} categories={data.rows.map((r) => r.category)} />
</div>
