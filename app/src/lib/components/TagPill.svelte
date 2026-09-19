<script lang="ts">
	import type { NecessityTag } from '$lib/finance/types';

	let { tag, overridden = false }: { tag: NecessityTag; overridden?: boolean } = $props();

	const labels: Record<NecessityTag, string> = {
		essential: 'essential',
		discretionary: 'discretionary',
		wasteful: 'wasteful'
	};
</script>

<span
	class="tag"
	class:border-danger={tag === 'wasteful'}
	class:text-danger={tag === 'wasteful'}
	title={overridden ? 'Overridden on this transaction' : "Category default"}
>
	{labels[tag]}{overridden ? ' *' : ''}
</span>
