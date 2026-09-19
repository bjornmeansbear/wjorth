<script lang="ts">
	let { period, years }: { period: string; years: string[] } = $props();

	function onChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		const url = new URL(window.location.href);
		url.searchParams.set('period', value);
		window.location.href = url.toString();
	}
</script>

<select value={period} onchange={onChange} class="btn">
	<option value="all">All time</option>
	<option value="month">This month</option>
	<option value="3m">Last 3 months</option>
	<option value="6m">Last 6 months</option>
	<option value="ytd">Year to date</option>
	<option value="year">This year</option>
	{#each years.filter((y) => y !== String(new Date().getFullYear())) as year}
		<option value={year}>{year}</option>
	{/each}
</select>
