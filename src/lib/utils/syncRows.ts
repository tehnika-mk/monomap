import type { KanbanBoard, MapData } from '$lib/types';
import type { Tombstones } from '$lib/db/tombstones';

export interface RemoteMapRow {
	id: string;
	user_id: string;
	title: string;
	folder_id: string | null;
	created_at: number;
	updated_at: number;
	map_data: MapData;
	deleted_at: number | null;
}

export interface RemoteBoardRow {
	id: string;
	user_id: string;
	title: string;
	source_map_id: string | null;
	created_at: number;
	updated_at: number;
	board_data: KanbanBoard;
	deleted_at: number | null;
}

export interface MapTombstoneRow {
	id: string;
	user_id: string;
	title: string;
	folder_id: string | null;
	created_at: number;
	updated_at: number;
	map_data: Record<string, unknown>;
	deleted_at: number;
}

export interface BoardTombstoneRow {
	id: string;
	user_id: string;
	title: string;
	source_map_id: string | null;
	created_at: number;
	updated_at: number;
	board_data: Record<string, unknown>;
	deleted_at: number;
}

export interface SyncRows {
	maps: RemoteMapRow[];
	boards: RemoteBoardRow[];
	mapTombstones: MapTombstoneRow[];
	boardTombstones: BoardTombstoneRow[];
}

// Live rows and tombstones must be separate payloads: PostgREST requires every
// object in a bulk upsert to share the same set of keys. Tombstones are padded
// to every NOT NULL column so the upsert cannot be rejected, while `deleted_at`
// still marks the row as removed.
export function buildSyncRows(
	maps: MapData[],
	boards: KanbanBoard[],
	tombstones: Tombstones,
	userId: string,
	now: number
): SyncRows {
	return {
		maps: maps.map((m) => ({
			id: m.id,
			user_id: userId,
			title: m.title,
			folder_id: m.folderId,
			created_at: m.createdAt,
			updated_at: m.updatedAt,
			map_data: m,
			deleted_at: null
		})),
		boards: boards.map((b) => ({
			id: b.id,
			user_id: userId,
			title: b.title,
			source_map_id: b.sourceMapId,
			created_at: b.createdAt,
			updated_at: b.updatedAt,
			board_data: b,
			deleted_at: null
		})),
		mapTombstones: Object.entries(tombstones.maps).map(([id, deletedAt]) => ({
			id,
			user_id: userId,
			title: '',
			folder_id: null,
			created_at: deletedAt,
			updated_at: deletedAt,
			map_data: {},
			deleted_at: deletedAt
		})),
		boardTombstones: Object.entries(tombstones.boards).map(([id, deletedAt]) => ({
			id,
			user_id: userId,
			title: '',
			source_map_id: null,
			created_at: deletedAt,
			updated_at: deletedAt,
			board_data: {},
			deleted_at: deletedAt
		}))
	};
}

// Local deletion is newer than the cloud row: keep it deleted.
export function tombstoneWins(tombstoneTs: number | undefined, remoteUpdatedAt: number): boolean {
	return tombstoneTs !== undefined && tombstoneTs >= remoteUpdatedAt;
}

// The cloud has accepted the deletion: the tombstone is no longer needed.
export function tombstoneConfirmed(tombstoneTs: number | undefined, remoteDeletedAt: number): boolean {
	return tombstoneTs !== undefined && remoteDeletedAt >= tombstoneTs;
}
