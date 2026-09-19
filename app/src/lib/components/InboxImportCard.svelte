<script lang="ts">
	import { enhance } from '$app/forms';
	import type { InboxFile } from '$lib/server/inbox';

	let { file }: { file: InboxFile } = $props();

	let acct = $state(file.fileName.replace(/\.csv$/i, ''));
	let dateCol = $state(file.guessedMapping.dateCol);
	let descCol = $state(file.guessedMapping.descCol);
	let amountCol = $state(file.guessedMapping.amountCol);
	let debitCol = $state(file.guessedMapping.debitCol);
	let creditCol = $state(file.guessedMapping.creditCol);
	let mode = $state(file.guessedMapping.mode);
	let invert = $state(false);
	let result = $state<{ added: number; skipped: number } | null>(null);
</script>

<div class="panel mb-4">
	<div class="panel-header">New file in inbox: {file.fileName}</div>
	<div class="panel-body">
		{#if result}
			<p>Imported {result.added} transactions, skipped {result.skipped} (duplicates or unreadable rows).</p>
		{:else}
			<form
				method="POST"
				action="?/importFile"
				use:enhance={() => {
					return async ({ result: r }) => {
						if (r.type === 'success' && r.data) {
							result = { added: r.data.added as number, skipped: r.data.skipped as number };
						}
					};
				}}
			>
				<input type="hidden" name="fileName" value={file.fileName} />
				<div class="grid grid-cols-2 tablet:grid-cols-4 gap-4 mb-4">
					<label class="text-sm">
						Account name
						<input class="btn w-full" name="acct" bind:value={acct} />
					</label>
					<label class="text-sm">
						Date column
						<select class="btn w-full" name="dateCol" bind:value={dateCol}>
							{#each file.headers as h}<option value={h}>{h}</option>{/each}
						</select>
					</label>
					<label class="text-sm">
						Description column
						<select class="btn w-full" name="descCol" bind:value={descCol}>
							{#each file.headers as h}<option value={h}>{h}</option>{/each}
						</select>
					</label>
					<label class="text-sm">
						Mode
						<select class="btn w-full" name="mode" bind:value={mode}>
							<option value="single">Single amount column</option>
							<option value="split">Separate debit/credit</option>
						</select>
					</label>
					{#if mode === 'single'}
						<label class="text-sm">
							Amount column
							<select class="btn w-full" name="amountCol" bind:value={amountCol}>
								{#each file.headers as h}<option value={h}>{h}</option>{/each}
							</select>
						</label>
						<label class="text-sm flex items-center gap-2 mt-6">
							<input type="checkbox" name="invert" bind:checked={invert} />
							Positive = spend (invert sign)
						</label>
					{:else}
						<label class="text-sm">
							Debit column
							<select class="btn w-full" name="debitCol" bind:value={debitCol}>
								{#each file.headers as h}<option value={h}>{h}</option>{/each}
							</select>
						</label>
						<label class="text-sm">
							Credit column
							<select class="btn w-full" name="creditCol" bind:value={creditCol}>
								{#each file.headers as h}<option value={h}>{h}</option>{/each}
							</select>
						</label>
					{/if}
				</div>

				<p class="caption-muted mb-2">Preview ({file.previewRows.length} rows):</p>
				<div class="overflow-x-auto mb-4">
					<table class="text-xs">
						<thead>
							<tr>{#each file.headers as h}<th class="pr-4 text-left">{h}</th>{/each}</tr>
						</thead>
						<tbody>
							{#each file.previewRows as row}
								<tr>{#each file.headers as h}<td class="pr-4">{row[h]}</td>{/each}</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<button type="submit" class="btn btn-accent">Import</button>
				<button type="submit" formaction="?/discardFile" class="btn">Skip (don't import)</button>
			</form>
		{/if}
	</div>
</div>
