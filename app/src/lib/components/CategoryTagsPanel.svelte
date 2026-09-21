<script lang="ts">
	import { enhance } from '$app/forms';
	import type { NecessityTag } from '$lib/finance/types';

	let { categoryTags }: { categoryTags: Record<string, NecessityTag> } = $props();
</script>

<details class="panel">
	<summary class="panel-header cursor-pointer">Category defaults</summary>
	<div class="panel-body">
		<ul class="text-sm space-y-2">
			{#each Object.entries(categoryTags).sort(([a], [b]) => a.localeCompare(b)) as [category, tag]}
				<li class="flex justify-between items-center border-t border-border pt-2">
					<span>{category}</span>
					<form method="POST" action="?/setCategoryTag" use:enhance>
						<input type="hidden" name="category" value={category} />
						<select
							name="tag"
							class="field"
							value={tag}
							onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}
						>
							<option value="essential">essential</option>
							<option value="discretionary">discretionary</option>
							<option value="wasteful">wasteful</option>
						</select>
					</form>
				</li>
			{/each}
		</ul>
	</div>
</details>
