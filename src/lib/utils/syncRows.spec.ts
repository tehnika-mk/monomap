import { describe, expect, it } from 'vitest';
import type { KanbanBoard, MapData } from '$lib/types';
import { buildSyncRows, tombstoneConfirmed, tombstoneWins } from './syncRows';

function map(id: string): MapData {
	return {
		id,
		folderId: null,
		title: `Map ${id}`,
		createdAt: 1,
		updatedAt: 2,
		rootNode: { id: `${id}-root`, text: 'Root', position: { x: 0, y: 0 }, children: [] }
	};
}

function board(id: string): KanbanBoard {
	return {
		id,
		title: `Board ${id}`,
		sourceMapId: null,
		columns: [],
		createdAt: 1,
		updatedAt: 2
	};
}

describe('buildSyncRows', () => {
	it('builds full live rows for maps and boards', () => {
		const rows = buildSyncRows([map('m1')], [board('b1')], { maps: {}, boards: {} }, 'user-1', 999);
		expect(rows.maps).toHaveLength(1);
		expect(rows.maps[0]).toMatchObject({
			id: 'm1',
			user_id: 'user-1',
			title: 'Map m1',
			folder_id: null,
			created_at: 1,
			updated_at: 2,
			deleted_at: null
		});
		expect(rows.boards[0]).toMatchObject({ id: 'b1', source_map_id: null, deleted_at: null });
		expect(rows.mapTombstones).toHaveLength(0);
		expect(rows.boardTombstones).toHaveLength(0);
	});

	it('pads tombstones to every NOT NULL column', () => {
		const rows = buildSyncRows([], [], { maps: { gone: 5 }, boards: { dead: 7 } }, 'user-1', 999);
		expect(rows.mapTombstones[0]).toEqual({
			id: 'gone',
			user_id: 'user-1',
			title: '',
			folder_id: null,
			created_at: 5,
			updated_at: 5,
			map_data: {},
			deleted_at: 5
		});
		expect(rows.boardTombstones[0]).toEqual({
			id: 'dead',
			user_id: 'user-1',
			title: '',
			source_map_id: null,
			created_at: 7,
			updated_at: 7,
			board_data: {},
			deleted_at: 7
		});
	});
});

describe('tombstone resolution', () => {
	it('keeps a deletion when the tombstone is at least as new as the cloud row', () => {
		expect(tombstoneWins(100, 100)).toBe(true);
		expect(tombstoneWins(101, 100)).toBe(true);
		expect(tombstoneWins(99, 100)).toBe(false);
		expect(tombstoneWins(undefined, 100)).toBe(false);
	});

	it('confirms a tombstone once the cloud deletion is at least as new', () => {
		expect(tombstoneConfirmed(100, 100)).toBe(true);
		expect(tombstoneConfirmed(100, 99)).toBe(false);
		expect(tombstoneConfirmed(undefined, 100)).toBe(false);
	});
});
