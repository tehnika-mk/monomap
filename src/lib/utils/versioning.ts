import type { KanbanBoard } from '$lib/types';

export const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000;
export const MAX_VERSIONS_PER_MAP = 25;
export const MAX_VERSIONS_PER_BOARD = 25;

export function countBoardCards(board: KanbanBoard): number {
	return board.columns.reduce((total, column) => total + column.cards.length, 0);
}

export interface SnapshotEligibility {
	now: number;
	lastSnapshotAt: number | undefined;
	lastSnapshottedUpdatedAt: number | undefined;
	mapUpdatedAt: number;
	intervalMs?: number;
}

export function shouldSnapshotMap(e: SnapshotEligibility): boolean {
	if (e.mapUpdatedAt === e.lastSnapshottedUpdatedAt) return false;
	const interval = e.intervalMs ?? SNAPSHOT_INTERVAL_MS;
	return e.now - (e.lastSnapshotAt ?? 0) >= interval;
}

export interface VersionRow {
	id: string;
	created_at: number;
}

/** Rows to delete: everything beyond the newest `cap`, given rows sorted newest-first. */
export function pruneVersionRows<T extends VersionRow>(rowsNewestFirst: T[], cap: number): T[] {
	return rowsNewestFirst.slice(cap);
}

export function versionTimestamp(now = Date.now()): { version: number; created_at: number } {
	return { version: Math.floor(now / 1000), created_at: now };
}
