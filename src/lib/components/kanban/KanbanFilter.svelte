<script lang="ts">
	import { kanban } from '$lib/stores/kanban.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	function clear() {
		kanban.filterQuery = '';
	}

	const placeholder = $derived(ui.isCompact ? 'Filter cards' : 'Filter cards (Ctrl+F)');
</script>

<div class="filter" role="search">
	<span class="icon" aria-hidden="true"><Icon name="search" size={14} /></span>
	<input
		bind:this={kanban.searchInputEl}
		bind:value={kanban.filterQuery}
		type="text"
		placeholder={placeholder}
		aria-label="Filter cards"
		spellcheck="false"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				kanban.filterQuery = '';
				(e.currentTarget as HTMLInputElement).blur();
			}
		}}
	/>
	{#if kanban.filterQuery}
		<button type="button" class="clear" aria-label="Clear filter" onclick={clear}>
			<Icon name="x" size={13} />
		</button>
	{/if}
</div>

<style>
	.filter {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		width: 200px;
		max-width: 40vw;
	}

	.icon {
		position: absolute;
		left: 10px;
		font-size: calc(13px + var(--font-bump));
		color: var(--muted);
		pointer-events: none;
	}

	input {
		width: 100%;
		min-width: 0;
		padding: 7px 28px 7px 28px;
		border: 1px solid var(--edge);
		border-radius: var(--r-sm);
		background: var(--surface);
		color: var(--fg);
		font-size: calc(12.5px + var(--font-bump));
		outline: none;
	}

	input:focus {
		border-color: var(--accent);
	}

	input::placeholder {
		color: var(--muted);
	}

	.clear {
		position: absolute;
		right: 6px;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(16px + var(--font-bump));
		line-height: 1;
		cursor: pointer;
		padding: 2px 4px;
		border-radius: 4px;
	}

	.clear:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	@media (max-width: 640px) {
		.filter {
			width: 140px;
		}
	}
</style>
