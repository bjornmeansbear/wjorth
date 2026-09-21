<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { CategoryBucket } from '$lib/finance/charts';
	import { fmtMoney } from '$lib/finance/amounts';
	import { readChartTheme, stableColorMap } from '$lib/finance/chartTheme';

	// `categories` is the full known category list, used only to build a
	// STABLE color assignment — not the bars themselves (`data`, which is
	// already bucketed to top-8 + Other for the current period). Colors are
	// keyed by category name so they match the transaction table regardless
	// of how the current period's top-8 ranking shifts.
	let { data, categories }: { data: CategoryBucket[]; categories: string[] } = $props();

	let canvas = $state<HTMLCanvasElement>();
	let chart: Chart | undefined;

	function render() {
		if (!canvas) return;
		const theme = readChartTheme();
		const colorMap = stableColorMap(categories);
		const otherColor = theme.textMuted;

		chart?.destroy();
		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: data.map((d) => d.category),
				datasets: [
					{
						data: data.map((d) => d.amount),
						backgroundColor: data.map((d) => (d.category === 'Other' ? otherColor : colorMap[d.category]))
					}
				]
			},
			options: {
				indexAxis: 'y',
				plugins: {
					legend: { display: false },
					tooltip: { callbacks: { label: (ctx) => fmtMoney(ctx.parsed.x ?? 0) } }
				},
				scales: {
					x: { ticks: { color: theme.textMuted, font: { family: theme.fontMono } } },
					y: { ticks: { color: theme.text } }
				}
			}
		});
	}

	onMount(render);
	$effect(() => {
		data;
		if (canvas) render();
	});
	onDestroy(() => chart?.destroy());
</script>

<div class="panel">
	<div class="panel-header">Spend by category</div>
	<div class="panel-body">
		{#if data.length === 0}
			<p class="caption-muted">No outflow in this period.</p>
		{:else}
			<canvas bind:this={canvas} height="220"></canvas>
		{/if}
	</div>
</div>
