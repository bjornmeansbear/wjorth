<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Debt } from '$lib/finance/types';

	let {
		debt,
		accounts,
		onsaved
	}: {
		// A saved debt (has id) is edited in place; a draft without one is added.
		debt: Partial<Debt>;
		accounts: string[];
		onsaved?: () => void;
	} = $props();

	let isNew = $derived(!debt.id);
	let showPromo = $state(false);
	let error = $state('');
</script>

<form
	method="POST"
	action="?/saveDebt"
	class="grid grid-cols-2 tablet:grid-cols-6 gap-2 items-end"
	use:enhance={() => {
		return async ({ result, update }) => {
			if (result.type === 'failure') {
				error = String(result.data?.message ?? 'Couldn’t save.');
				return;
			}
			error = '';
			await update({ reset: isNew });
			if (result.type === 'success') onsaved?.();
		};
	}}
>
	<input type="hidden" name="id" value={debt.id ?? ''} />
	<label class="text-sm col-span-2">
		Name
		<input class="field w-full" name="name" value={debt.name ?? ''} required />
	</label>
	<label class="text-sm">
		Balance ($)
		<input class="field w-full font-mono" type="number" step="0.01" min="0" name="balance" value={debt.balance ?? ''} required />
	</label>
	<label class="text-sm">
		APR (%)
		<input class="field w-full font-mono" type="number" step="0.01" min="0" name="apr" value={debt.apr ?? ''} required />
	</label>
	<label class="text-sm">
		Minimum ($/mo)
		<input class="field w-full font-mono" type="number" step="0.01" min="0" name="minPayment" value={debt.minPayment ?? ''} required />
	</label>
	<label class="text-sm">
		Statements
		<select class="field w-full" name="account" value={debt.account ?? ''}>
			<option value="">(none)</option>
			{#each accounts as a}
				<option value={a}>{a}</option>
			{/each}
		</select>
	</label>

	{#if showPromo || debt.promoApr != null}
		<label class="text-sm">
			Intro APR (%)
			<input class="field w-full font-mono" type="number" step="0.01" min="0" name="promoApr" value={debt.promoApr ?? ''} />
		</label>
		<label class="text-sm">
			Intro months left
			<input class="field w-full font-mono" type="number" step="1" min="0" name="promoMonths" value={debt.promoMonths ?? ''} />
		</label>
	{/if}

	<div class="col-span-2 tablet:col-span-6 flex flex-wrap gap-2 items-center">
		<button type="submit" class="btn btn-accent">{isNew ? 'Add card' : 'Save'}</button>
		{#if !showPromo && debt.promoApr == null}
			<button type="button" class="btn" onclick={() => (showPromo = true)}>Has an intro rate…</button>
		{/if}
		{#if !isNew}
			<button type="submit" class="btn" formaction="?/deleteDebt" formnovalidate aria-label="Remove {debt.name}">Remove</button>
		{/if}
		{#if error}
			<p class="text-danger text-sm mb-0" role="alert">{error}</p>
		{/if}
	</div>
</form>
