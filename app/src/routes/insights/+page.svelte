<script lang="ts">
	import type { PageProps } from './$types';
	import WasteRollup from '$lib/components/WasteRollup.svelte';
	import { fmtMoney } from '$lib/finance/amounts';

	let { data }: PageProps = $props();
</script>

<div class="max-w-5xl mx-auto p-6 space-y-6">
	<div class="flex flex-wrap justify-between items-center gap-4">
		<h1>Insights</h1>
		<a href="/" class="btn">← Dashboard</a>
	</div>

	<WasteRollup rollup={data.rollup} />

	<div class="panel">
		<div class="panel-header">Recurring charges worth reconsidering</div>
		<div class="panel-body">
			<p class="caption-muted mb-4">
				Recurring charges tagged discretionary or wasteful, ranked by what they cost annualized — the biggest
				candidates to cut.
			</p>
			{#if data.recurringWaste.length === 0}
				<p class="caption-muted">Nothing recurring is currently tagged discretionary or wasteful.</p>
			{:else}
				<table class="w-full text-sm">
					<thead>
						<tr class="label-upper text-left">
							<th class="pb-2">Merchant</th>
							<th class="pb-2 text-right">Annual cost</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recurringWaste as g}
							<tr class="border-t border-border">
								<td class="py-2">{g.merchant}</td>
								<td class="py-2 text-right font-mono font-bold text-danger">{fmtMoney(g.annual)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>

	<div class="grid tablet:grid-cols-2 gap-4">
		<div class="panel">
			<div class="panel-header">Biggest discretionary spend</div>
			<div class="panel-body">
				<ol class="text-sm space-y-2">
					{#each data.discretionary as t}
						<li class="flex justify-between border-b border-border pb-2">
							<span>{t.description}</span>
							<span class="font-mono">{fmtMoney(t.amount)}</span>
						</li>
					{/each}
				</ol>
			</div>
		</div>
		<div class="panel">
			<div class="panel-header">Biggest wasteful spend</div>
			<div class="panel-body">
				<ol class="text-sm space-y-2">
					{#each data.wasteful as t}
						<li class="flex justify-between border-b border-border pb-2">
							<span>{t.description}</span>
							<span class="font-mono text-danger">{fmtMoney(t.amount)}</span>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</div>
</div>
