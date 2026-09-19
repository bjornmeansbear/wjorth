<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { CategoryBucket } from '$lib/finance/charts';
	import { fmtMoney } from '$lib/finance/amounts';
	import { readChartTheme, categoryPalette } from '$lib/finance/chartTheme';

	let { data }: { data: CategoryBucket[] } = $props();

	let canvas = $state<HTMLCanvasElement>();
	let chart: Chart | undefined;

	function render() {
		if (!canvas) return;
		const theme = readChartTheme();
		const palette = categoryPalette();

		chart?.destroy();
		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: data.map((d) => d.category),
				datasets: [
					{
						data: data.map((d) => d.amount),
						backgroundColor: data.map((_, i) => palette[i % palette.length])
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
