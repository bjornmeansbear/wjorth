<script lang="ts">
	import type { PageProps } from './$types';
	import PeriodSelect from '$lib/components/PeriodSelect.svelte';
	import KpiRow from '$lib/components/KpiRow.svelte';
	import CategoryChart from '$lib/components/CategoryChart.svelte';
	import TimeChart from '$lib/components/TimeChart.svelte';
	import RecurringList from '$lib/components/RecurringList.svelte';
	import TopMerchants from '$lib/components/TopMerchants.svelte';
	import TransactionTable from '$lib/components/TransactionTable.svelte';
	import RulesPanel from '$lib/components/RulesPanel.svelte';
	import CategoryTagsPanel from '$lib/components/CategoryTagsPanel.svelte';
	import InboxImportCard from '$lib/components/InboxImportCard.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { data }: PageProps = $props();
</script>

<div class="max-w-5xl mx-auto p-6 space-y-6">
	<div class="flex flex-wrap justify-between items-center gap-4">
		<h1>Wjorth</h1>
		<div class="flex gap-2 items-center">
			<a href="/budget" class="btn">Budget</a>
			<a href="/insights" class="btn">Insights</a>
			<a href="/export" class="btn">Export CSV</a>
			<ThemeToggle />
		</div>
	</div>

	{#each data.inboxFiles as file (file.fileName)}
		<InboxImportCard {file} />
	{/each}

	<PeriodSelect period={data.period} years={data.years} />

	<KpiRow kpis={data.kpis} />

	<div class="grid tablet:grid-cols-2 gap-4">
		<CategoryChart data={data.categoryChart} />
		<TimeChart data={data.timeChart} />
	</div>

	<div class="grid tablet:grid-cols-2 gap-4">
		<RecurringList groups={data.recurring} categoryTags={data.state.categoryTags} />
		<TopMerchants merchants={data.topMerchants} />
	</div>

	<TransactionTable
		transactions={data.state.transactions}
		categories={data.categories}
		categoryTags={data.state.categoryTags}
	/>

	<div class="grid tablet:grid-cols-2 gap-4">
		<RulesPanel rules={data.state.rules} categories={data.categories} />
		<CategoryTagsPanel categoryTags={data.state.categoryTags} />
	</div>
</div>
