import { workspace } from '$lib/stores/workspace.svelte';
import { kanban } from '$lib/stores/kanban.svelte';
import { toasts } from '$lib/stores/toasts.svelte';

const UNDO_MS = 6000;

export function deleteCardWithUndo(boardId: string, cardId: string): void {
	const location = workspace.findCardLocation(boardId, cardId);
	if (!location) return;
	if (kanban.editingCardBoardId === boardId && kanban.editingCardId === cardId) kanban.closeCard();
	workspace.deleteCard(boardId, cardId);
	toasts.push('Card deleted', 'info', UNDO_MS, {
		label: 'Undo',
		run: () => workspace.restoreCard(boardId, location.columnId, location.card, location.index)
	});
}
