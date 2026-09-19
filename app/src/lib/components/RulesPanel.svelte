<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Rule } from '$lib/finance/types';

	let { rules, categories }: { rules: Rule[]; categories: string[] } = $props();

	let newKeyword = $state('');
	let newCategory = $state(categories[0] ?? '');
</script>

<details class="panel">
	<summary class="panel-header cursor-pointer">Rules ({rules.length})</summary>
	<div class="panel-body">
		<form method="POST" action="?/addRule" use:enhance class="flex gap-2 mb-4 flex-wrap">
			<input class="btn" name="keyword" placeholder="keyword" bind:value={newKeyword} required />
			<input class="btn" name="category" placeholder="category" bind:value={newCategory} required />
			<button type="submit" class="btn btn-accent">Add rule</button>
		</form>

		<ul class="text-sm space-y-1 max-h-96 overflow-y-auto">
			{#each rules as r}
				<li class="flex justify-between items-center border-t border-border pt-1">
					<span><span class="font-mono">{r.keyword}</span> → {r.category}</span>
					<form method="POST" action="?/deleteRule" use:enhance>
						<input type="hidden" name="keyword" value={r.keyword} />
						<button type="submit" class="btn">Delete</button>
					</form>
				</li>
			{/each}
		</ul>
	</div>
</details>
