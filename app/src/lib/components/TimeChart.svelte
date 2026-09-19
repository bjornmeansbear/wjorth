<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { TimeBucket } from '$lib/finance/charts';
	import { fmtMoney } from '$lib/finance/amounts';
	import { readChartTheme } from '$lib/finance/chartTheme';

	let { data }: { data: TimeBucket[] } = $props();

	let canvas = $state<HTMLCanvasElement>();
	let chart: Chart | undefined;

	function render() {
		if (!canvas) return;
		const theme = readChartTheme();

		chart?.destroy();
		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels: data.map((d) => d.key),
				datasets: [
					{
						data: data.map((d) => d.amount),
						borderColor: theme.dataPrimary,
						backgroundColor: theme.dataPrimary,
						borderWidth: 2,
						pointRadius: 2,
						tension: 0.15
					}
				]
			},
			options: {
				plugins: {
					legend: { display: false },
					tooltip: { callbacks: { label: (ctx) => fmtMoney(ctx.parsed.y ?? 0) } }
				},
				scales: {
					x: { ticks: { color: theme.textMuted } },
					y: { ticks: { color: theme.textMuted, font: { family: theme.fontMono } } }
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
	<div class="panel-header">Spend over time</div>
	<div class="panel-body">
		{#if data.length === 0}
			<p class="caption-muted">No outflow in this period.</p>
		{:else}
			<canvas bind:this={canvas} height="220"></canvas>
		{/if}
	</div>
</div>
