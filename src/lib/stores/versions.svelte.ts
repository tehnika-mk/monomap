import { supabase, isStudio } from '$lib/supabase';
import { auth } from '$lib/stores/auth.svelte';
import { workspace } from '$lib/stores/workspace.svelte';
import { countNodes } from '$lib/utils/tree';
import {
	pruneVersionRows,
	shouldSnapshotMap,
	versionTimestamp,
	countBoardCards,
	MAX_VERSIONS_PER_MAP,
	MAX_VERSIONS_PER_BOARD
} from '$lib/utils/versioning';
import type { KanbanBoard, MapData } from '$lib/types';

// Supabase PostgrestError is a plain object, not an Error instance, so the
// usual `err instanceof Error` check hides the real message.
function errMessage(err: unknown, fallback: string): string {
	if (err instanceof Error) return err.message;
	const message = (err as { message?: unknown } | null)?.message;
	return typeof message === 'string' && message ? message : fallback;
}

export interface MapVersion {
	id: string;
	map_id: string;
	version: number;
	node_count: number;
	created_at: number;
}

export interface BoardVersion {
	id: string;
	board_id: string;
	version: number;
	card_count: number;
	created_at: number;
}

export class VersionsState {
	list = $state<Record<string, MapVersion[]>>({});
	boardList = $state<Record<string, BoardVersion[]>>({});
	loading = $state(false);
	error = $state('');
	restoring = $state(false);

	private lastSnapshotAt: Record<string, number> = {};
	private lastSnapshottedUpdatedAt: Record<string, number> = {};
	private lastBoardSnapshotAt: Record<string, number> = {};
	private lastBoardSnapshottedUpdatedAt: Record<string, number> = {};

	get studio(): boolean {
		return auth.user !== null && isStudio(auth.profile);
	}

	async maybeSnapshot(map: MapData): Promise<void> {
		if (!this.studio) return;
		const eligible = shouldSnapshotMap({
			now: Date.now(),
			lastSnapshotAt: this.lastSnapshotAt[map.id],
			lastSnapshottedUpdatedAt: this.lastSnapshottedUpdatedAt[map.id],
			mapUpdatedAt: map.updatedAt
		});
		if (eligible) await this.snapshotNow(map);
	}

	// Forced capture, e.g. right before a restore so it stays reversible.
	async snapshotNow(map: MapData): Promise<boolean> {
		if (!this.studio || !auth.user) return false;
		const { version, created_at } = versionTimestamp();
		const row = {
			id: `ver_${crypto.randomUUID()}`,
			user_id: auth.user.id,
			map_id: map.id,
			version,
			node_count: countNodes(map.rootNode),
			map_data: map,
			created_at
		};
		try {
			const { error } = await supabase.from('user_map_versions').insert(row);
			if (error) throw error;
			this.lastSnapshotAt[map.id] = created_at;
			this.lastSnapshottedUpdatedAt[map.id] = map.updatedAt;
			await this.pruneOld(map.id);
			await this.loadList(map.id);
			return true;
		} catch (err) {
			console.warn('version snapshot failed', err);
			return false;
		}
	}

	private async pruneOld(mapId: string): Promise<void> {
		if (!auth.user) return;
		try {
			const { data } = await supabase
				.from('user_map_versions')
				.select('id, created_at')
				.eq('user_id', auth.user.id)
				.eq('map_id', mapId)
				.order('created_at', { ascending: false })
				.order('version', { ascending: false });
			const stale = pruneVersionRows((data as MapVersion[]) ?? [], MAX_VERSIONS_PER_MAP);
			for (const row of stale) {
				await supabase.from('user_map_versions').delete().eq('id', row.id);
			}
		} catch (err) {
			console.warn('version prune failed', err);
		}
	}

	async loadList(mapId: string): Promise<void> {
		if (!this.studio || !auth.user) return;
		this.loading = true;
		this.error = '';
		try {
			const { data, error } = await supabase
				.from('user_map_versions')
				.select('id, map_id, version, node_count, created_at')
				.eq('user_id', auth.user.id)
				.eq('map_id', mapId)
				.order('created_at', { ascending: false })
				.limit(50);
			if (error) throw error;
			this.list = { ...this.list, [mapId]: (data as MapVersion[]) ?? [] };
		} catch (err) {
			this.error = errMessage(err, 'Could not load version history');
		} finally {
			this.loading = false;
		}
	}

	async restore(mapId: string, versionId: string): Promise<boolean> {
		if (!this.studio || !auth.user) return false;
		const current = workspace.maps.find((m) => m.id === mapId);
		if (!current) return false;
		this.restoring = true;
		try {
			await this.snapshotNow(current);
			const { data, error } = await supabase
				.from('user_map_versions')
				.select('map_data')
				.eq('id', versionId)
				.eq('map_id', mapId)
				.maybeSingle();
			if (error || !data?.map_data) throw error ?? new Error('Version not found');
			workspace.restoreMapSnapshot(data.map_data as MapData);
			return true;
		} catch (err) {
			this.error = errMessage(err, 'Could not restore version');
			return false;
		} finally {
			this.restoring = false;
		}
	}

	// --- board versions ---

	async maybeSnapshotBoard(board: KanbanBoard): Promise<void> {
		if (!this.studio) return;
		const eligible = shouldSnapshotMap({
			now: Date.now(),
			lastSnapshotAt: this.lastBoardSnapshotAt[board.id],
			lastSnapshottedUpdatedAt: this.lastBoardSnapshottedUpdatedAt[board.id],
			mapUpdatedAt: board.updatedAt
		});
		if (eligible) await this.snapshotBoardNow(board);
	}

	async snapshotBoardNow(board: KanbanBoard): Promise<boolean> {
		if (!this.studio || !auth.user) return false;
		const { version, created_at } = versionTimestamp();
		const row = {
			id: `bver_${crypto.randomUUID()}`,
			user_id: auth.user.id,
			board_id: board.id,
			version,
			card_count: countBoardCards(board),
			board_data: board,
			created_at
		};
		try {
			const { error } = await supabase.from('user_board_versions').insert(row);
			if (error) throw error;
			this.lastBoardSnapshotAt[board.id] = created_at;
			this.lastBoardSnapshottedUpdatedAt[board.id] = board.updatedAt;
			await this.pruneBoardOld(board.id);
			await this.loadBoardList(board.id);
			return true;
		} catch (err) {
			console.warn('board version snapshot failed', err);
			return false;
		}
	}

	private async pruneBoardOld(boardId: string): Promise<void> {
		if (!auth.user) return;
		try {
			const { data } = await supabase
				.from('user_board_versions')
				.select('id, created_at')
				.eq('user_id', auth.user.id)
				.eq('board_id', boardId)
				.order('created_at', { ascending: false })
				.order('version', { ascending: false });
			const stale = pruneVersionRows((data as BoardVersion[]) ?? [], MAX_VERSIONS_PER_BOARD);
			for (const row of stale) {
				await supabase.from('user_board_versions').delete().eq('id', row.id);
			}
		} catch (err) {
			console.warn('board version prune failed', err);
		}
	}

	async loadBoardList(boardId: string): Promise<void> {
		if (!this.studio || !auth.user) return;
		this.loading = true;
		this.error = '';
		try {
			const { data, error } = await supabase
				.from('user_board_versions')
				.select('id, board_id, version, card_count, created_at')
				.eq('user_id', auth.user.id)
				.eq('board_id', boardId)
				.order('created_at', { ascending: false })
				.limit(50);
			if (error) throw error;
			this.boardList = { ...this.boardList, [boardId]: (data as BoardVersion[]) ?? [] };
		} catch (err) {
			this.error = errMessage(err, 'Could not load version history');
		} finally {
			this.loading = false;
		}
	}

	async restoreBoard(boardId: string, versionId: string): Promise<boolean> {
		if (!this.studio || !auth.user) return false;
		const current = workspace.boards.find((b) => b.id === boardId);
		if (!current) return false;
		this.restoring = true;
		try {
			await this.snapshotBoardNow(current);
			const { data, error } = await supabase
				.from('user_board_versions')
				.select('board_data')
				.eq('id', versionId)
				.eq('board_id', boardId)
				.maybeSingle();
			if (error || !data?.board_data) throw error ?? new Error('Version not found');
			workspace.restoreBoardSnapshot(data.board_data as KanbanBoard);
			return true;
		} catch (err) {
			this.error = errMessage(err, 'Could not restore version');
			return false;
		} finally {
			this.restoring = false;
		}
	}
}

export const versions = new VersionsState();
