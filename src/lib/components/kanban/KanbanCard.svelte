<script lang="ts">
	import type { KanbanCard } from '$lib/types';
	import { kanban } from '$lib/stores/kanban.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { dueStatus, formatDueDate } from '$lib/utils/due';
	import { openNodeLocation } from '$lib/utils/kanbanLink';
	import { deleteCardWithUndo } from '$lib/utils/kanbanCardActions';
	import { clickOutside } from '$lib/actions/clickOutside';
	import Icon from '$lib/components/ui/Icon.svelte';

	let {
		boardId,
		sourceMapId,
		columnId,
		card,
		hidden = false,
		preview = false,
		dropLine = null
	}: {
		boardId: string;
		sourceMapId: string | null;
		columnId: string;
		card: KanbanCard;
		hidden?: boolean;
		preview?: boolean;
		dropLine?: 'before' | 'after' | null;
	} = $props();

	const doneCount = $derived(card.checklist?.filter((i) => i.done).length ?? 0);
	const total = $derived(card.checklist?.length ?? 0);
	const due = $derived(card.dueDate ? dueStatus(card.dueDate) : null);
	const firstLine = $derived(
		card.description ? card.description.replace(/\r\n/g, '\n').split('\n').find((l) => l.trim())?.trim() ?? '' : ''
	);

	let pointerStart: { x: number; y: number } | null = null;
	let suppressClick = false;

	let renaming = $state(false);
	let titleDraft = $state('');
	let menuOpen = $state(false);
	let menuPos = $state({ x: 0, y: 0 });
	let dblPending = false;
	let dblTimer: ReturnType<typeof setTimeout> | undefined;

	function clearDbl() {
		if (dblTimer) clearTimeout(dblTimer);
		dblTimer = undefined;
		dblPending = false;
	}

	function startRename() {
		titleDraft = card.title;
		renaming = true;
	}

	function commitRename() {
		const value = titleDraft.trim();
		if (value) workspace.updateCardTitle(boardId, card.id, value);
		renaming = false;
	}

	function autofocus(el: HTMLInputElement) {
		el.focus();
		el.select();
	}

	function toggleComplete() {
		workspace.toggleCardComplete(boardId, card.id);
	}

	function openEditor() {
		if (dblPending) clearDbl();
		kanban.openCard(boardId, card.id);
	}

	function stopActions(e: Event) {
		e.stopPropagation();
	}

	function toggleMenu(e: MouseEvent) {
		if (menuOpen) {
			menuOpen = false;
			return;
		}
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const width = 152;
		menuPos = {
			x: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
			y: rect.bottom + 4
		};
		menuOpen = true;
	}

	$effect(() => {
		if (!menuOpen) return;
		const close = () => (menuOpen = false);
		window.addEventListener('resize', close);
		window.addEventListener('scroll', close, true);
		return () => {
			window.removeEventListener('resize', close);
			window.removeEventListener('scroll', close, true);
		};
	});

	function handleClick() {
		if (suppressClick) return;
		if (dblPending) {
			clearDbl();
			startRename();
			return;
		}
		dblPending = true;
		dblTimer = setTimeout(() => {
			dblPending = false;
			kanban.openCard(boardId, card.id);
		}, 220);
	}

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		pointerStart = { x: e.clientX, y: e.clientY };
	}

	function onPointerMove(e: PointerEvent) {
		if (!pointerStart) return;
		if (!kanban.drag) {
			const dx = e.clientX - pointerStart.x;
			const dy = e.clientY - pointerStart.y;
			if (Math.hypot(dx, dy) > 4) {
				clearDbl();
				(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
				kanban.startCardDrag(boardId, columnId, card.id);
				kanban.updateDragPos(e.clientX, e.clientY);
			}
		} else {
			kanban.updateDragPos(e.clientX, e.clientY);
		}
	}

	function onPointerUp(e: PointerEvent) {
		if (kanban.drag) {
			kanban.drop();
			suppressClick = true;
			setTimeout(() => (suppressClick = false), 0);
			clearDbl();
		}
		const el = e.currentTarget as HTMLElement;
		if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
		pointerStart = null;
	}

	function onPointerCancel(e: PointerEvent) {
		if (kanban.drag) kanban.cancelDrag();
		clearDbl();
		const el = e.currentTarget as HTMLElement;
		if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
		pointerStart = null;
	}

	function chipFg(color: string): string {
		const hex = color.replace('#', '');
		if (hex.length !== 6) return '#ffffff';
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return lum > 0.6 ? '#1a1a1a' : '#ffffff';
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="card"
	class:is-hidden={hidden}
	class:completed={card.completed}
	class:preview
	class:drop-before={dropLine === 'before'}
	class:drop-after={dropLine === 'after'}
	data-card={preview ? undefined : card.id}
	role={preview ? undefined : 'button'}
	tabindex={preview ? undefined : 0}
	onclick={preview ? undefined : handleClick}
	onkeydown={preview
		? undefined
		: (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					openEditor();
				}
			}}
	onpointerdown={preview ? undefined : onPointerDown}
	onpointermove={preview ? undefined : onPointerMove}
	onpointerup={preview ? undefined : onPointerUp}
	onpointercancel={preview ? undefined : onPointerCancel}
>
	<button
		type="button"
		class="check"
		class:on={card.completed}
		aria-pressed={card.completed}
		aria-label={card.completed ? 'Mark incomplete' : 'Mark complete'}
		title={card.completed ? 'Mark incomplete' : 'Mark complete'}
		onclick={(e) => {
			e.stopPropagation();
			toggleComplete();
		}}
		onpointerdown={stopActions}
		onkeydown={stopActions}
	>
		✓
	</button>

	<div class="card-body">
		{#if renaming}
			<input
				class="rename-input"
				bind:value={titleDraft}
				placeholder="Card title"
				use:autofocus
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => {
					e.stopPropagation();
					if (e.key === 'Enter') commitRename();
					if (e.key === 'Escape') renaming = false;
				}}
				onblur={commitRename}
			/>
		{:else if card.title}
			<span class="title">{card.title}</span>
		{/if}
		{#if card.labels?.length}
			<div class="labels">
				{#each card.labels as label (label.text + label.color)}
					<span
						class="chip"
						style:--chip={label.color}
						style:--chip-fg={chipFg(label.color)}
						title={label.text}
					>
						{label.text}
					</span>
				{/each}
			</div>
		{/if}
		{#if firstLine}
			<span class="desc">{firstLine}</span>
		{/if}
		{#if total > 0}
			<div class="checklist" title={`${doneCount}/${total} done`}>
				<span class="progress" style:--done={total > 0 ? (doneCount / total) * 100 : 0}></span>
				<span class="check-text"><Icon name="circle-check" size={12} /> {doneCount}/{total}</span>
			</div>
		{/if}
		{#if due}
			<span class="due" class:overdue={due === 'overdue'} class:soon={due === 'soon'}>
				<Icon name="calendar" size={12} /> {formatDueDate(card.dueDate!)}
			</span>
		{/if}
		{#if card.sourceNodeId}
			<button
				type="button"
				class="map-link"
				title="Open in mind map"
				onclick={(e) => {
					e.stopPropagation();
					openNodeLocation(sourceMapId, card.sourceNodeId!);
				}}
			>
				Map ↗
			</button>
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="card-actions"
		onclick={stopActions}
		onpointerdown={stopActions}
		onpointerup={stopActions}
		onkeydown={stopActions}
	>
		<div class="menu-wrap" use:clickOutside={() => (menuOpen = false)}>
			<button
				type="button"
				class="act menu-btn"
				aria-label="Card actions"
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				onclick={toggleMenu}
			>
				<Icon name="more-horizontal" size={16} />
			</button>
			{#if menuOpen}
				<div class="menu" role="menu" style:left={`${menuPos.x}px`} style:top={`${menuPos.y}px`}>
					<button type="button" role="menuitem" onclick={() => { menuOpen = false; toggleComplete(); }}>
						{card.completed ? 'Mark incomplete' : 'Mark complete'}
					</button>
					<button
						type="button"
						role="menuitem"
						class="danger"
						onclick={() => {
							menuOpen = false;
							deleteCardWithUndo(boardId, card.id);
						}}
					>
						Delete
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		padding: 10px 34px 10px 10px;
		font-size: calc(13px + var(--font-bump));
		box-shadow: var(--node-shadow);
		cursor: pointer;
		user-select: none;
		touch-action: none;
	}

	.card:hover {
		border-color: var(--muted);
	}

	.card.is-hidden {
		display: none;
	}

	.card-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.card.completed .card-body {
		opacity: 0.65;
	}

	.card.completed .title {
		color: var(--muted);
		text-decoration: line-through;
	}

	.card.preview {
		cursor: default;
	}

	.card.preview .card-actions {
		display: none;
	}

	.card.drop-before::before,
	.card.drop-after::after {
		content: '';
		position: absolute;
		left: 2px;
		right: 2px;
		height: 3px;
		border-radius: 9999px;
		background: var(--accent);
		opacity: 0.7;
	}

	.card.drop-before::before {
		top: -6px;
	}

	.card.drop-after::after {
		bottom: -6px;
	}

	.check {
		flex: none;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: 2px solid var(--muted);
		border-radius: 9999px;
		background: transparent;
		color: transparent;
		font-size: calc(11px + var(--font-bump));
		line-height: 1;
		cursor: pointer;
		transition:
			background 0.12s ease,
			border-color 0.12s ease,
			color 0.12s ease;
	}

	.check:hover {
		border-color: var(--accent);
		color: color-mix(in srgb, var(--accent) 55%, transparent);
	}

	.check.on {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--accent-fg);
	}

	.card-actions {
		position: absolute;
		top: 5px;
		right: 5px;
		display: flex;
		align-items: center;
		gap: 1px;
	}

	@media (hover: hover) {
		.card-actions {
			opacity: 0;
			transition: opacity 120ms ease;
		}

		.card:hover .card-actions,
		.card:focus-within .card-actions {
			opacity: 1;
		}
	}

	.act {
		flex: none;
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(12px + var(--font-bump));
		line-height: 1;
		cursor: pointer;
		border-radius: var(--r-sm);
		padding: 0;
	}

	.act:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.menu-wrap {
		position: relative;
		display: flex;
	}

	.menu {
		position: fixed;
		z-index: 80;
		min-width: 152px;
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
		color: #ef4444;
	}

	.title {
		line-height: 1.4;
		word-break: break-word;
	}

	.rename-input {
		width: 100%;
		padding: 3px 6px;
		border: 1px solid var(--accent);
		border-radius: var(--r-sm);
		background: var(--surface);
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		outline: none;
	}

	.labels {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.chip {
		font-size: calc(11px + var(--font-bump));
		font-weight: 600;
		padding: 1px 8px;
		border-radius: var(--r-xs);
		color: var(--chip-fg, #fff);
		background: var(--chip);
	}

	.desc {
		font-size: calc(12px + var(--font-bump));
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.checklist {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.progress {
		flex: 1;
		height: 5px;
		border-radius: 9999px;
		background: var(--surface-2);
		overflow: hidden;
		position: relative;
	}

	.progress::after {
		content: '';
		position: absolute;
		inset: 0;
		width: calc(var(--done) * 1%);
		background: var(--accent);
		border-radius: inherit;
	}

	.check-text {
		flex: none;
		font-size: calc(11px + var(--font-bump));
		color: var(--muted);
	}

	.due {
		align-self: flex-start;
		font-size: calc(11px + var(--font-bump));
		font-weight: 600;
		padding: 1px 8px;
		border-radius: var(--r-xs);
		color: var(--muted);
		background: var(--surface-2);
	}

	.due.soon {
		color: var(--warn);
		background: var(--warn-soft);
	}

	.due.overdue {
		color: var(--danger);
		background: var(--danger-soft);
	}

	.map-link {
		align-self: flex-start;
		flex: none;
		border: none;
		background: transparent;
		color: var(--accent);
		font-size: calc(11px + var(--font-bump));
		font-weight: 600;
		padding: 0;
		cursor: pointer;
	}

	.map-link:hover {
		text-decoration: underline;
	}
</style>
