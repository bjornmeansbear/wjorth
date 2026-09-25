<script lang="ts">
	import { enhance } from '$app/forms';
	import { fmtMoney } from '$lib/finance/amounts';

	let {
		merchants,
		years
	}: {
		merchants: string[];
		years: { year: string; out: number; in: number; count: number }[];
	} = $props();
</script>

<details class="panel">
	<summary class="panel-header cursor-pointer">Wjerk ({merchants.length} merchants)</summary>
	<div class="panel-body space-y-6">
		<div>
			<h3 class="label-upper mb-2">For the accountant</h3>
			{#if years.length === 0}
				<p class="caption-muted">
					Nothing marked yet. Add a merchant below, or check "Wjerk" on a transaction.
				</p>
			{:else}
				<table class="w-full text-sm">
					<thead>
						<tr class="label-upper text-left">
							<th class="pb-2 px-2">Year</th>
							<th class="pb-2 px-2 text-right">Spent</th>
							<th class="pb-2 px-2 text-right">Received</th>
							<th class="pb-2 px-2"><span class="sr-only">Download</span></th>
						</tr>
					</thead>
					<tbody>
						{#each years as y}
							<tr class="border-t border-border">
								<td class="py-2 px-2 font-mono">{y.year}</td>
								<td class="py-2 px-2 text-right font-mono">{fmtMoney(y.out)}</td>
								<td class="py-2 px-2 text-right font-mono">{fmtMoney(y.in)}</td>
								<td class="py-2 px-2 text-right">
									<a class="btn" href="/export?wjerk=1&year={y.year}" download>
										CSV<span class="sr-only"> of {y.count} Wjerk transactions for {y.year}</span>
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>

		<div>
			<h3 class="label-upper mb-2">Wjerk merchants</h3>
			<p class="caption-muted mb-2">
				Every charge whose description contains one of these is marked Wjerk. You can still change it on any single transaction.
			</p>
			<form method="POST" action="?/addWjerkMerchant" use:enhance class="flex gap-2 mb-4 flex-wrap">
				<input class="field" name="keyword" placeholder="e.g. cloudflare" aria-label="Merchant keyword" required />
				<button type="submit" class="btn btn-accent">Add</button>
			</form>
			<ul class="text-sm space-y-1">
				{#each merchants as k}
					<li class="flex justify-between items-center border-t border-border pt-1">
						<span class="font-mono">{k}</span>
						<form method="POST" action="?/deleteWjerkMerchant" use:enhance>
							<input type="hidden" name="keyword" value={k} />
							<button type="submit" class="btn" aria-label="Remove {k}">Remove</button>
						</form>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</details>
