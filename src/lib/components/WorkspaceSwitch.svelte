<script lang="ts">
	import { workspace } from '$lib/stores/workspace.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	$effect(() => {
		if (workspace.viewMode === 'kanban' && !workspace.getActiveBoard() && workspace.boards.length > 0) {
			workspace.activeBoardId = workspace.boards[0].id;
		}
	});
</script>

<div class="switch" role="group" aria-label="Workspace mode">
	<button
		type="button"
		class="seg"
		class:active={workspace.viewMode === 'mindmap'}
		aria-pressed={workspace.viewMode === 'mindmap'}
		title="Mind Map"
		onclick={() => workspace.setViewMode('mindmap')}
	>
		<span class="glyph"><Icon name="mindmap" size={14} /></span>
		<span class="seg-label">Mind Map</span>
	</button>
	<button
		type="button"
		class="seg"
		class:active={workspace.viewMode === 'kanban'}
		aria-pressed={workspace.viewMode === 'kanban'}
		title="Kanban Board"
		onclick={() => workspace.setViewMode('kanban')}
	>
		<span class="glyph"><Icon name="board" size={14} /></span>
		<span class="seg-label">Kanban</span>
	</button>
</div>

<style>
	.switch {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 3px;
		border-radius: var(--r-md);
		background: var(--surface-2);
		border: 1px solid var(--edge);
		flex: 1;
		min-width: 0;
	}

	.seg {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 5px 10px;
		border: none;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--muted);
		font-size: calc(12.5px + var(--font-bump));
		cursor: pointer;
		white-space: nowrap;
		transition:
			background var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease);
	}

	.seg:hover {
		color: var(--fg);
	}

	.seg.active {
		background: var(--surface);
		color: var(--fg);
		font-weight: 600;
		box-shadow: var(--shadow-1);
	}

	.glyph {
		display: inline-flex;
		align-items: center;
		line-height: 1;
	}
</style>
