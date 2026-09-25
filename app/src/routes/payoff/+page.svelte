<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import type { Debt } from '$lib/finance/types';
	import { fmtMoney, fmtMoneyWhole } from '$lib/finance/amounts';
	import { simulatePayoff, withBalanceTransfer, type PayoffResult, type PayoffStrategy } from '$lib/finance/payoff';
	import DebtForm from '$lib/components/DebtForm.svelte';

	let { data }: PageProps = $props();

	let accounts = $derived(data.history.map((h) => h.account));
	let historyByAccount = $derived(new Map(data.history.map((h) => [h.account, h])));

	// Recent reality: what actually went to these cards per month lately.
	let recentPayments = $derived(Math.round(data.history.reduce((s, h) => s + h.avgPayment, 0)));
	let minTotal = $derived(data.debts.reduce((s, d) => s + d.minPayment, 0));
	let totalBalance = $derived(data.debts.reduce((s, d) => s + d.balance, 0));

	// Local edits win until saved; otherwise the saved plan, otherwise what
	// you've actually been paying.
	let monthlyEdit = $state<number | null>(null);
	let strategyEdit = $state<PayoffStrategy | null>(null);
	let monthly = $derived(monthlyEdit ?? data.payoff.monthly ?? recentPayments);
	let strategy = $derived(strategyEdit ?? data.payoff.strategy);

	let extra = $state(450);
	let moveIds = $state<string[] | null>(null);
	let feePct = $state(3);
	let promoMonths = $state(18);
	let aprAfter = $state(24.99);

	// Default the transfer to the highest-rate card — the one costing the most.
	let highestApr = $derived([...data.debts].sort((a, b) => b.apr - a.apr)[0]?.id);
	let moving = $derived(moveIds ?? (highestApr ? [highestApr] : []));
	let offer = $derived({ feePct, promoApr: 0, promoMonths, aprAfter });

	let plan = $derived(simulatePayoff(data.debts, monthly, strategy));
	let scenarios = $derived.by(() => {
		const transferred = withBalanceTransfer(data.debts, moving, offer);
		const rows: { label: string; result: PayoffResult }[] = [
			{ label: 'Minimums only', result: simulatePayoff(data.debts, minTotal, strategy, { rollover: false }) },
			{ label: 'Your plan', result: plan },
			{ label: `Your plan + ${fmtMoneyWhole(extra)}/mo`, result: simulatePayoff(data.debts, monthly + extra, strategy) },
			{ label: 'Your plan + balance transfer', result: simulatePayoff(transferred, monthly, strategy) },
			{ label: 'Both', result: simulatePayoff(transferred, monthly + extra, strategy) }
		];
		return rows;
	});

	let draft = $state<Partial<Debt>>({});
	let draftKey = $state(0);
	function prefill(account: string) {
		draft = { name: account, account };
		draftKey++;
	}
	let unlinked = $derived(data.history.filter((h) => !data.debts.some((d) => d.account === h.account)));

	function whenPaidOff(months: number | null): string {
		if (months === null) return 'Never';
		const d = new Date();
		d.setDate(1);
		d.setMonth(d.getMonth() + months);
		return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
	}
	function duration(months: number | null): string {
		if (months === null) return '50+ years';
		const y = Math.floor(months / 12);
		const m = months % 12;
		return [y && `${y} yr`, m && `${m} mo`].filter(Boolean).join(' ') || '0 mo';
	}
</script>

<div class="max-w-5xl mx-auto p-6 space-y-6">
	<div class="flex flex-wrap justify-between items-center gap-4">
		<h1>Payoff</h1>
		<a href="/" class="btn">← Dashboard</a>
	</div>

	<details class="panel">
		<summary class="panel-header cursor-pointer">How this works</summary>
		<div class="panel-body">
			<p>
				Each month, every card gets its minimum. Everything else you put toward the cards goes to
				one card at a time. When a card is paid off, its minimum moves to the next one.
			</p>
			<p>
				<strong>Avalanche</strong> aims the extra at the highest interest rate first. It always
				costs the least. <strong>Snowball</strong> aims it at the smallest balance first. It costs
				a bit more, but you close cards sooner, which keeps some people going.
			</p>
			<p class="mb-0 caption-muted">
				Assumes no new charges on these cards, rates stay the same, and minimums stay fixed. Real
				minimums shrink as balances fall, which makes "minimums only" even slower than shown.
			</p>
		</div>
	</details>

	<section class="panel" aria-labelledby="cards-h">
		<h2 class="panel-header m-0" id="cards-h">Your cards</h2>
		<div class="panel-body space-y-6">
			{#if data.debts.length === 0}
				<p class="mb-0">
					Add each card from its latest statement: the balance, the APR (the purchase rate), and
					the minimum payment. Your CSVs have transactions but not balances, so these have to be
					typed in.
				</p>
			{/if}

			{#each data.debts as d (d.id)}
				{@const h = d.account ? historyByAccount.get(d.account) : undefined}
				<div class="border-t border-border pt-4">
					<DebtForm debt={d} {accounts} />
					{#if h}
						<p class="caption-muted mt-2 mb-0">
							At {d.apr}% on {fmtMoneyWhole(d.balance)}, expect about
							<span class="font-mono">{fmtMoneyWhole((d.balance * d.apr) / 1200)}</span>/mo in
							interest. Your last {h.months} statements averaged
							<span class="font-mono">{fmtMoneyWhole(h.avgInterest)}</span>, and you paid about
							<span class="font-mono">{fmtMoneyWhole(h.avgPayment)}</span>/mo.
						</p>
					{/if}
				</div>
			{/each}

			<div class="border-t border-border pt-4">
				<h3 class="label-upper mb-2">Add a card</h3>
				{#if unlinked.length > 0}
					<div class="flex flex-wrap gap-2 mb-4">
						{#each unlinked as h}
							<button type="button" class="btn" onclick={() => prefill(h.account)}>
								{h.account}
								<span class="caption-muted font-mono">· {fmtMoneyWhole(h.avgInterest)}/mo interest</span>
							</button>
						{/each}
					</div>
				{/if}
				{#key draftKey}
					<DebtForm debt={draft} {accounts} onsaved={() => ((draft = {}), draftKey++)} />
				{/key}
			</div>
		</div>
	</section>

	{#if data.debts.length > 0}
		<section class="panel" aria-labelledby="plan-h">
			<h2 class="panel-header m-0" id="plan-h">Your plan</h2>
			<div class="panel-body space-y-6">
				<form method="POST" action="?/savePlan" use:enhance class="flex flex-wrap gap-4 items-end">
					<label class="text-sm">
						Toward all cards each month ($)
						<input
							class="field w-40 font-mono"
							type="number"
							step="1"
							min="0"
							name="monthly"
							value={monthly}
							oninput={(e) => (monthlyEdit = Number((e.currentTarget as HTMLInputElement).value) || 0)}
						/>
					</label>
					<fieldset class="flex gap-4 items-center text-sm">
						<legend class="sr-only">Strategy</legend>
						{#each ['avalanche', 'snowball'] as const as s}
							<label class="flex items-center gap-1">
								<input type="radio" name="strategy" value={s} checked={strategy === s} onchange={() => (strategyEdit = s)} />
								{s === 'avalanche' ? 'Avalanche (highest rate first)' : 'Snowball (smallest balance first)'}
							</label>
						{/each}
					</fieldset>
					<button type="submit" class="btn btn-accent">Save plan</button>
				</form>
				<p class="caption-muted mb-0">
					Minimums add up to <span class="font-mono">{fmtMoneyWhole(minTotal)}</span>/mo. Over the
					last 3 months you've paid about <span class="font-mono">{fmtMoneyWhole(recentPayments)}</span>/mo
					to the cards you've imported.
				</p>

				<div aria-live="polite">
					{#if plan.shortfall > 0}
						<p class="text-danger" role="alert">
							{fmtMoneyWhole(monthly)} is {fmtMoneyWhole(plan.shortfall)} short of the minimums. The
							numbers below assume you pay the minimums.
						</p>
					{/if}
					{#if plan.months === null}
						<p class="text-danger mb-0">
							At this amount the balances don't get paid off: the payments barely cover the interest.
						</p>
					{:else}
						<div class="grid grid-cols-2 tablet:grid-cols-4 gap-4">
							<div>
								<div class="label-upper">Owed now</div>
								<div class="font-mono text-lg">{fmtMoneyWhole(totalBalance)}</div>
							</div>
							<div>
								<div class="label-upper">Debt-free</div>
								<div class="font-mono text-lg">{whenPaidOff(plan.months)}</div>
								<div class="caption-muted">{duration(plan.months)}</div>
							</div>
							<div>
								<div class="label-upper">Interest to go</div>
								<div class="font-mono text-lg">{fmtMoneyWhole(plan.totalInterest)}</div>
							</div>
							<div>
								<div class="label-upper">Interest per $1 owed</div>
								<div class="font-mono text-lg">{fmtMoney(plan.totalInterest / totalBalance)}</div>
							</div>
						</div>
					{/if}
				</div>

				{#if plan.months !== null}
					<div class="-mx-5 overflow-x-auto">
						<table class="w-full text-sm">
							<caption class="sr-only">Payoff order</caption>
							<thead>
								<tr class="label-upper text-left">
									<th class="pb-2 px-2">#</th>
									<th class="pb-2 px-2">Card</th>
									<th class="pb-2 px-2">Paid off</th>
									<th class="pb-2 px-2 text-right">Interest paid</th>
								</tr>
							</thead>
							<tbody>
								{#each plan.perDebt as r, i}
									<tr class="border-t border-border">
										<td class="py-2 px-2 font-mono">{i + 1}</td>
										<td class="py-2 px-2">{r.name}</td>
										<td class="py-2 px-2 font-mono whitespace-nowrap">{whenPaidOff(r.month)}</td>
										<td class="py-2 px-2 text-right font-mono">{fmtMoneyWhole(r.interest)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</section>

		<section class="panel" aria-labelledby="whatif-h">
			<h2 class="panel-header m-0" id="whatif-h">What if</h2>
			<div class="panel-body space-y-6">
				<p class="caption-muted mb-0">Nothing here is saved. Try numbers and see what changes.</p>
				<div class="flex flex-wrap gap-6 items-start">
					<label class="text-sm">
						Extra each month ($)
						<input class="field w-32 font-mono block" type="number" step="10" min="0" bind:value={extra} />
					</label>
					<fieldset class="text-sm space-y-1">
						<legend class="mb-1">Move to a balance-transfer card</legend>
						{#each data.debts as d}
							<label class="flex items-center gap-1">
								<input
									type="checkbox"
									checked={moving.includes(d.id)}
									onchange={(e) =>
										(moveIds = (e.currentTarget as HTMLInputElement).checked
											? [...moving, d.id]
											: moving.filter((id) => id !== d.id))}
								/>
								{d.name} <span class="caption-muted font-mono">({d.apr}%)</span>
							</label>
						{/each}
					</fieldset>
					<div class="flex flex-wrap gap-2">
						<label class="text-sm">
							Transfer fee (%)
							<input class="field w-20 font-mono block" type="number" step="0.5" min="0" bind:value={feePct} />
						</label>
						<label class="text-sm">
							0% for (months)
							<input class="field w-20 font-mono block" type="number" step="1" min="0" bind:value={promoMonths} />
						</label>
						<label class="text-sm">
							APR after (%)
							<input class="field w-20 font-mono block" type="number" step="0.01" min="0" bind:value={aprAfter} />
						</label>
					</div>
				</div>

				<div class="-mx-5 overflow-x-auto">
					<table class="w-full text-sm">
						<caption class="sr-only">Scenarios compared</caption>
						<thead>
							<tr class="label-upper text-left">
								<th class="pb-2 px-2">Scenario</th>
								<th class="pb-2 px-2">Debt-free</th>
								<th class="pb-2 px-2 text-right">Interest</th>
								<th class="pb-2 px-2 text-right">vs. your plan</th>
							</tr>
						</thead>
						<tbody>
							{#each scenarios as s}
								{@const diff = plan.totalInterest - s.result.totalInterest}
								<tr class="border-t border-border" class:font-bold={s.result === plan}>
									<th scope="row" class="py-2 px-2 text-left font-normal" class:font-bold={s.result === plan}>{s.label}</th>
									<td class="py-2 px-2 font-mono whitespace-nowrap">
										{whenPaidOff(s.result.months)}
										<span class="caption-muted">· {duration(s.result.months)}</span>
									</td>
									<td class="py-2 px-2 text-right font-mono">
										{s.result.months === null ? '—' : fmtMoneyWhole(s.result.totalInterest)}
									</td>
									<td class="py-2 px-2 text-right font-mono" class:text-success={diff > 1 && s.result.months !== null}>
										{#if s.result === plan || s.result.months === null || plan.months === null}
											—
										{:else if diff > 1}
											saves {fmtMoneyWhole(diff)}
										{:else}
											costs {fmtMoneyWhole(-diff)} more
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<p class="caption-muted mb-0">
					The transfer's fee is added to the moved balance up front. Its minimum is the moved cards'
					minimums combined, so you keep paying what you were paying.
				</p>
			</div>
		</section>
	{/if}
</div>
