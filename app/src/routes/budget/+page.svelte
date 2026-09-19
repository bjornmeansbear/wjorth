<script lang="ts">
	import type { PageProps } from './$types';
	import UnallocatedBanner from '$lib/components/UnallocatedBanner.svelte';
	import BudgetTable from '$lib/components/BudgetTable.svelte';

	let { data }: PageProps = $props();

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

	<UnallocatedBanner unallocated={data.unallocated} income={data.income} />
	<BudgetTable rows={data.rows} month={data.month} categoryTags={data.categoryTags} />
</div>
