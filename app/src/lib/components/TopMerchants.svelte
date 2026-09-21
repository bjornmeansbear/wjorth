<script lang="ts">
	import type { MerchantTotal } from '$lib/finance/charts';
	import { fmtMoney } from '$lib/finance/amounts';

	let { merchants }: { merchants: MerchantTotal[] } = $props();
</script>

<details class="panel" open>
	<summary class="panel-header cursor-pointer">Top merchants</summary>
	<div class="panel-body">
		{#if merchants.length === 0}
			<p class="caption-muted">No outflow in this period.</p>
		{:else}
			<ol class="text-sm space-y-2">
				{#each merchants as m}
					<li class="flex justify-between border-b border-border pb-2">
						<span>{m.description}</span>
						<span class="font-mono">{fmtMoney(m.amount)}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</details>
