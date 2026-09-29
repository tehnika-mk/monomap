<script lang="ts">
	import type { KanbanCard as KanbanCardType, KanbanColumn } from '$lib/types';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { kanban } from '$lib/stores/kanban.svelte';
	import { cardMatches } from '$lib/utils/kanbanFilter';
	import { clickOutside } from '$lib/actions/clickOutside';
	import KanbanCard from './KanbanCard.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	let {
		boardId,
		sourceMapId,
		column
	}: {
		boardId: string;
		sourceMapId: string | null;
		column: KanbanColumn;
	} = $props();

	let menuOpen = $state(false);
	let renaming = $state(false);
	let titleDraft = $state('');
	let addingCard = $state(false);
	let cardDraft = $state('');

	const count = $derived(column.cards.length);
	const doneCount = $derived(column.cards.filter((c) => c.completed).length);

	// Card drops and column reorders share `dragOver`, so only treat this column
	// as a card target while a card is being dragged.
	const isCardDragTarget = $derived(
		kanban.drag?.kind === 'card' && kanban.dragOver?.columnId === column.id
	);
	const isColumnSource = $derived(
		kanban.drag?.kind === 'column' && kanban.drag.columnId === column.id
	);
	const cardDropIndex = $derived(isCardDragTarget ? (kanban.dragOver?.index ?? -1) : -1);

	function cardHidden(card: KanbanCardType): boolean {
		return !cardMatches(card, kanban.filterQuery) || (!kanban.showCompleted && !!card.completed);
	}

	const visibleCards = $derived(column.cards.filter((c) => !cardHidden(c)));
	const lastVisibleIndex = $derived.by(() => {
		const last = visibleCards[visibleCards.length - 1];
		return last ? column.cards.indexOf(last) : -1;
	});

	let gripStart: { x: number; y: number } | null = null;

	function dropLineAt(index: number): 'before' | 'after' | null {
		if (cardDropIndex === index) return 'before';
		if (cardDropIndex === count && index === lastVisibleIndex) return 'after';
		return null;
	}

	function autofocus(el: HTMLInputElement) {
		el.focus();
	}

	function startRename() {
		titleDraft = column.title;
		renaming = true;
		menuOpen = false;
	}

	function commitRename() {
		const value = titleDraft.trim();
		if (value) workspace.renameColumn(boardId, column.id, value);
		renaming = false;
	}

	function commitCard() {
		const value = cardDraft.trim();
		if (value) {
			workspace.createCard(boardId, column.id, value);
			cardDraft = '';
		} else {
			addingCard = false;
		}
	}

	function gripPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		gripStart = { x: e.clientX, y: e.clientY };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function gripPointerMove(e: PointerEvent) {
		if (!gripStart) return;
		if (!kanban.drag) {
			const dx = e.clientX - gripStart.x;
			const dy = e.clientY - gripStart.y;
			if (Math.hypot(dx, dy) > 4) {
				kanban.startColumnDrag(boardId, column.id);
				kanban.updateDragPos(e.clientX, e.clientY);
			}
		} else {
			kanban.updateDragPos(e.clientX, e.clientY);
		}
	}

	function gripPointerUp() {
		if (kanban.drag) kanban.drop();
		gripStart = null;
	}

	function gripPointerCancel() {
		if (kanban.drag) kanban.cancelDrag();
		gripStart = null;
	}
</script>

<section class="col" class:is-dragging={isColumnSource} data-column={column.id}>
	<header class="col-head">
		<button
			type="button"
			class="grip"
			title="Drag to reorder column"
			aria-label="Drag column"
			onpointerdown={gripPointerDown}
			onpointermove={gripPointerMove}
			onpointerup={gripPointerUp}
			onpointercancel={gripPointerCancel}
		>
			⋮⋮
		</button>
		{#if renaming}
			<input
				class="head-input"
				bind:value={titleDraft}
				use:autofocus
				onkeydown={(e) => {
					if (e.key === 'Enter') commitRename();
					if (e.key === 'Escape') renaming = false;
				}}
				onblur={commitRename}
			/>
		{:else}
			<span
				class="col-title"
				title="Double-click to rename"
				role="button"
				tabindex="0"
				ondblclick={startRename}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						startRename();
					}
				}}
			>
				{column.title || 'Untitled column'}
			</span>
		{/if}
		<span class="col-count" title={doneCount > 0 ? `${doneCount} completed` : undefined}>
			{#if doneCount > 0}
				{count - doneCount}
				<span class="done-count">· {doneCount}✓</span>
			{:else}
				{count}
			{/if}
		</span>
		<div class="menu-wrap" use:clickOutside={() => (menuOpen = false)}>
			<button
				type="button"
				class="menu-btn"
				aria-label="Column actions"
				onclick={() => (menuOpen = !menuOpen)}
			>
				<Icon name="more-horizontal" size={16} />
			</button>
			{#if menuOpen}
				<div class="menu">
					<button type="button" onclick={startRename}>Rename</button>
					<button
						type="button"
						class="danger"
						onclick={() => {
							menuOpen = false;
							workspace.deleteColumn(boardId, column.id);
						}}
					>
						Delete
					</button>
				</div>
			{/if}
		</div>
	</header>

	<div class="col-body">
		{#each column.cards as card, index (card.id)}
			<KanbanCard
				{boardId}
				{sourceMapId}
				columnId={column.id}
				{card}
				hidden={cardHidden(card)}
				dropLine={dropLineAt(index)}
			/>
		{/each}
		{#if isCardDragTarget && visibleCards.length === 0}
			<div class="drop-empty" aria-hidden="true"></div>
		{/if}

		{#if addingCard}
			<input
				class="card-input"
				bind:value={cardDraft}
				placeholder="Card title…"
				use:autofocus
				onkeydown={(e) => {
					if (e.key === 'Enter') commitCard();
					if (e.key === 'Escape') {
						addingCard = false;
						cardDraft = '';
					}
				}}
				onblur={commitCard}
			/>
		{:else}
			<button type="button" class="add-card" onclick={() => (addingCard = true)}>
				<Icon name="plus" size={14} /> Add card
			</button>
		{/if}
	</div>
</section>

<style>
	.col {
		flex: none;
		width: 272px;
		max-height: 100%;
		display: flex;
		flex-direction: column;
		border-radius: var(--r-md);
		border: 1px solid var(--edge);
		background: var(--surface-2);
	}

	.col.is-dragging {
		opacity: 0.5;
	}

	.col-head {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 8px 10px 8px;
		flex: none;
	}

	.grip {
		flex: none;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(11px + var(--font-bump));
		letter-spacing: -1px;
		line-height: 1;
		cursor: grab;
		padding: 2px 4px;
		border-radius: 4px;
		touch-action: none;
		user-select: none;
	}

	.grip:hover {
		color: var(--fg);
		background: var(--surface);
	}

	.grip:active {
		cursor: grabbing;
	}

	.col-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: calc(13px + var(--font-bump));
		font-weight: 600;
	}

	.head-input {
		flex: 1;
		min-width: 0;
		padding: 3px 6px;
		border: 1px solid var(--accent);
		border-radius: var(--r-sm);
		background: var(--surface);
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		outline: none;
	}

	.col-count {
		flex: none;
		font-size: calc(11px + var(--font-bump));
		color: var(--muted);
		background: var(--surface);
		border-radius: var(--r-sm);
		padding: 1px 8px;
	}

	.done-count {
		color: var(--accent);
	}

	.menu-wrap {
		position: relative;
		flex: none;
		display: flex;
	}

	.menu-btn {
		flex: none;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(15px + var(--font-bump));
		line-height: 1;
		cursor: pointer;
		padding: 0 4px;
		border-radius: 4px;
	}

	.menu-btn:hover {
		color: var(--fg);
		background: var(--surface);
	}

	.menu {
		position: absolute;
		right: 0;
		top: calc(100% + 4px);
		z-index: 30;
		min-width: 150px;
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.14);
		padding: 4px;
		display: flex;
		flex-direction: column;
	}

	.menu button {
		text-align: left;
		padding: 7px 10px;
		border: none;
		background: transparent;
		border-radius: var(--r-sm);
		color: var(--fg);
		font-size: calc(12.5px + var(--font-bump));
		cursor: pointer;
	}

	.menu button:hover {
		background: var(--surface-2);
	}

	.menu button.danger {
		color: var(--danger);
	}

	.col-body {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 4px 8px 8px;
		min-height: 60px;
	}

	.drop-empty {
		position: relative;
		height: 0;
	}

	.drop-empty::after {
		content: '';
		position: absolute;
		left: 2px;
		right: 2px;
		top: -4px;
		height: 3px;
		border-radius: 9999px;
		background: var(--accent);
		opacity: 0.7;
	}

	.card-input {
		padding: 9px 12px;
		border: 1px solid var(--accent);
		border-radius: var(--r-sm);
		background: var(--surface);
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		outline: none;
	}

	.add-card {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		padding: 7px 10px;
		border: none;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--muted);
		font-size: calc(12.5px + var(--font-bump));
		cursor: pointer;
	}

	.add-card:hover {
		background: var(--surface);
		color: var(--fg);
	}
</style>
