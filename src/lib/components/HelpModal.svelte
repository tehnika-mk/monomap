<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';

	let { onclose }: { onclose: () => void } = $props();

	let tab = $state<'mindmap' | 'kanban' | 'keys'>('mindmap');
</script>

<div class="backdrop" onclick={onclose} aria-hidden="true"></div>
<div class="modal" role="dialog" aria-modal="true" aria-label="Help and tutorial">
	<button type="button" class="close" aria-label="Close" onclick={onclose}><Icon name="x" size={14} /></button>
	<h2 class="title">Help &amp; tutorial</h2>

	<div class="tabs" role="tablist" aria-label="Help topics">
		<button
			type="button"
			role="tab"
			aria-selected={tab === 'mindmap'}
			class:on={tab === 'mindmap'}
			onclick={() => (tab = 'mindmap')}
		>
			Mind Map
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={tab === 'kanban'}
			class:on={tab === 'kanban'}
			onclick={() => (tab = 'kanban')}
		>
			Kanban
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={tab === 'keys'}
			class:on={tab === 'keys'}
			onclick={() => (tab = 'keys')}
		>
			Shortcuts
		</button>
	</div>

	{#if tab === 'mindmap'}
		<ol class="steps">
			<li>
				<strong>Start from the centre.</strong> Type an idea in the root node, then press
				<kbd>Tab</kbd> to branch a child and <kbd>Enter</kbd> for a sibling.
			</li>
			<li>
				<strong>Edit anything.</strong> Click or press <kbd>Space</kbd> on a node to edit its
				text. <kbd>Shift</kbd>+<kbd>Enter</kbd> adds a line break.
			</li>
			<li>
				<strong>Style it.</strong> Select a node to open the right panel — colours, emoji
				icons, links and notes.
			</li>
			<li>
				<strong>Move freely.</strong> Drag nodes anywhere; connections re-route to whichever
				side you place them. Pan with <kbd>Space</kbd>+drag, zoom with <kbd>Ctrl</kbd>+wheel.
			</li>
			<li>
				<strong>Lost?</strong> Press <kbd>Ctrl</kbd>+<kbd>0</kbd> to recenter on the root.
				Toggle the outline editor with <kbd>Ctrl</kbd>+<kbd>M</kbd>.
			</li>
		</ol>
	{:else if tab === 'kanban'}
		<ol class="steps">
			<li>
				<strong>Switch workspaces</strong> with the top toggle or <kbd>Ctrl</kbd>+<kbd>K</kbd>.
				Your mind map never closes.
			</li>
			<li>
				<strong>Organise work.</strong> Drag cards between columns, and drag a column by its
				grip to reorder it.
			</li>
			<li>
				<strong>Open a card</strong> to add a description, labels, a due date and a
				sub-task checklist.
			</li>
			<li>
				<strong>Find fast.</strong> Press <kbd>Ctrl</kbd>+<kbd>F</kbd> to filter cards by
				text, label or checklist item.
			</li>
			<li>
				<strong>Bridge both worlds.</strong> In the mind map, select a node and
				<em>Send to Kanban Board</em> — or jump back with the <em>Map ↗</em> chip on a card.
			</li>
		</ol>
	{:else}
		<table class="keys">
			<tbody>
				<tr><td>Create child node</td><td><kbd>Tab</kbd></td></tr>
				<tr><td>Create sibling node</td><td><kbd>Enter</kbd></td></tr>
				<tr><td>Multiline node text</td><td><kbd>Shift</kbd>+<kbd>Enter</kbd></td></tr>
				<tr><td>Edit node text</td><td><kbd>Space</kbd> / click</td></tr>
				<tr><td>Navigate nodes</td><td><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></td></tr>
				<tr><td>Delete node</td><td><kbd>Del</kbd></td></tr>
				<tr><td>Toggle sidebar</td><td><kbd>Ctrl</kbd>+<kbd>\</kbd></td></tr>
				<tr><td>Markdown split view</td><td><kbd>Ctrl</kbd>+<kbd>M</kbd></td></tr>
				<tr><td>Switch workspace</td><td><kbd>Ctrl</kbd>+<kbd>K</kbd></td></tr>
				<tr><td>New / close tab</td><td><kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd></td></tr>
				<tr><td>Zoom</td><td><kbd>Ctrl</kbd>+<kbd>+</kbd> / <kbd>−</kbd></td></tr>
				<tr><td>Center on root</td><td><kbd>Ctrl</kbd>+<kbd>0</kbd></td></tr>
			</tbody>
		</table>
	{/if}
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		background: rgb(0 0 0 / 0.4);
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: var(--z-modal);
		width: min(460px, calc(100vw - 32px));
		max-height: calc(100vh - 64px);
		overflow-y: auto;
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: var(--r-lg);
		box-shadow: 0 24px 64px rgb(0 0 0 / 0.28);
		padding: 24px;
	}

	.close {
		position: absolute;
		top: 12px;
		right: 12px;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(20px + var(--font-bump));
		line-height: 1;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: var(--r-sm);
	}

	.close:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.title {
		font-size: calc(17px + var(--font-bump));
		font-weight: 600;
		margin: 0 0 16px;
	}

	.tabs {
		display: flex;
		gap: 4px;
		padding: 3px;
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		background: var(--surface-2);
		margin-bottom: 16px;
	}

	.tabs button {
		flex: 1;
		padding: 7px 8px;
		border: none;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--muted);
		font-size: calc(12.5px + var(--font-bump));
		font-weight: 500;
		cursor: pointer;
	}

	.tabs button.on {
		background: var(--surface);
		color: var(--fg);
		box-shadow: 0 1px 4px rgb(0 0 0 / 0.12);
	}

	.steps {
		margin: 0;
		padding-left: 18px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: calc(13px + var(--font-bump));
		line-height: 1.55;
		color: var(--fg);
	}

	.steps strong {
		font-weight: 600;
	}

	.keys {
		width: 100%;
		border-collapse: collapse;
		font-size: calc(12.5px + var(--font-bump));
	}

	.keys td {
		padding: 6px 4px;
		border-bottom: 1px solid var(--edge);
		text-align: left;
	}

	.keys td:last-child {
		text-align: right;
		color: var(--muted);
		white-space: nowrap;
	}

	kbd {
		font-family: inherit;
		font-size: calc(11px + var(--font-bump));
		font-weight: 600;
		color: var(--fg);
		background: var(--surface-2);
		border: 1px solid var(--edge);
		border-bottom-width: 2px;
		border-radius: 4px;
		padding: 1px 5px;
	}
</style>
