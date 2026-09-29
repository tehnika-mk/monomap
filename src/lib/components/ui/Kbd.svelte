<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children }: { children?: Snippet } = $props();
</script>

<kbd>{@render children?.()}</kbd>

<style>
	kbd {
		display: inline-block;
		padding: 2px 6px;
		border: 1px solid var(--edge);
		border-bottom-width: 2px;
		border-radius: var(--r-sm);
		background: var(--surface-2);
		color: var(--fg);
		font-family: var(--font-mono);
		font-size: calc(11px + var(--font-bump));
		line-height: 1.5;
	}
</style>
