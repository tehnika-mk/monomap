import { supabase } from '$lib/supabase';
import { auth } from '$lib/stores/auth.svelte';
import { workspace } from '$lib/stores/workspace.svelte';
import { versions } from '$lib/stores/versions.svelte';
import { buildSyncRows, tombstoneConfirmed, tombstoneWins } from '$lib/utils/syncRows';
import {
	clearBoardDelete,
	clearBoardDeletes,
	clearMapDelete,
	clearMapDeletes,
	getBoardTombstone,
	getMapTombstone,
	getTombstones,
	recordBoardDelete,
	recordMapDelete,
	setTombstoneScope
} from '$lib/db/tombstones';
import type { Folder, KanbanBoard, MapData } from '$lib/types';

function resultError(result: unknown): string | null {
	if (!result || typeof result !== 'object') return null;
	const err = (result as { error?: { message?: string } | null }).error;
	return err?.message ?? null;
}

function settledFailed(result: PromiseSettledResult<unknown>): boolean {
	if (result.status === 'rejected') return true;
	return resultError(result.value) !== null;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'paused';

const PUSH_DEBOUNCE_MS = 800;

function getDeviceId(): string {
	try {
		const KEY = 'mindmap:device-id';
		let id = localStorage.getItem(KEY);
		if (!id) {
			id =
				typeof crypto !== 'undefined' && 'randomUUID' in crypto
					? crypto.randomUUID()
					: `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
			localStorage.setItem(KEY, id);
		}
		return id;
	} catch {
		return 'unknown-device';
	}
}

interface RemoteRow {
	id: string;
	user_id: string;
	title?: string | null;
	folder_id?: string | null;
	source_map_id?: string | null;
	created_at?: number;
	updated_at?: number;
	map_data?: MapData | null;
	board_data?: KanbanBoard | null;
	deleted_at?: number | null;
}

export class SyncState {
	status = $state<SyncStatus>('idle');
	lastSynced = $state(0);
	error = $state('');
	nudge = $state(false);

	// ids we know exist on the cloud, so deletions can be pushed as tombstones
	private knownRemoteMapIds = new Set<string>();
	private knownRemoteBoardIds = new Set<string>();

	private pushTimer: ReturnType<typeof setTimeout> | undefined;
	private latestSnapshot: ReturnType<typeof workspace.serialize> | null = null;
	private lastUserId: string | null = null;
	private presenceCheckedFor: string | null = null;

	constructor() {
		$effect.root(() => {
			$effect(() => {
				// Reading the serialized workspace registers deep dependencies, so any
				// local mutation re-runs this effect and schedules a push.
				const user = auth.user;
				const pro = auth.pro;
				const ready = workspace.ready;
				setTombstoneScope(user?.id ?? null);

				if (!user || !ready) {
					this.status = 'idle';
					return;
				}
				if (!pro) {
					this.status = 'paused';
					if (user.id !== this.presenceCheckedFor) {
						this.presenceCheckedFor = user.id;
						void this.checkPresence(user.id);
					}
					return;
				}
				this.nudge = false;
				if (this.lastUserId !== user.id) {
					this.lastUserId = user.id;
					this.status = 'syncing';
					void this.pull(user.id);
					return;
				}
				const snapshot = workspace.serialize();
				this.reconcileLocalDeletions(snapshot);
				this.schedulePush(snapshot);
			});
		});

		if (typeof window !== 'undefined') {
			window.addEventListener('online', () => {
				if (auth.user && auth.pro && this.lastUserId === auth.user.id) {
					void this.pull(auth.user.id);
				}
			});
			window.addEventListener('offline', () => (this.status = 'offline'));
			// Deletions are persisted synchronously, so this only needs to be
			// best-effort: an aborted request still retries on the next load.
			window.addEventListener('pagehide', () => this.flush());
		}
	}

	// Record a durable marker for any known cloud id that is no longer local, so
	// a delete is never lost if the debounced push has not run yet.
	private reconcileLocalDeletions(snapshot: ReturnType<typeof workspace.serialize>): void {
		const localMaps = new Set(snapshot.maps.map((m) => m.id));
		for (const id of this.knownRemoteMapIds) {
			if (!localMaps.has(id) && getMapTombstone(id) === undefined) recordMapDelete(id);
		}
		const localBoards = new Set(snapshot.boards.map((b) => b.id));
		for (const id of this.knownRemoteBoardIds) {
			if (!localBoards.has(id) && getBoardTombstone(id) === undefined) recordBoardDelete(id);
		}
	}

	// Called by the UI at delete time: persist the marker immediately and push,
	// so an immediate refresh still sees the deletion as pending.
	noteMapDeleted(id: string): void {
		setTombstoneScope(auth.user?.id ?? null);
		recordMapDelete(id);
		this.flush();
	}

	noteBoardDeleted(id: string): void {
		setTombstoneScope(auth.user?.id ?? null);
		recordBoardDelete(id);
		this.flush();
	}

	// Send the current state right away instead of waiting for the debounce.
	// Always serializes fresh state: the queued snapshot may predate the change
	// (e.g. a delete) that triggered the flush.
	flush(): void {
		if (this.pushTimer) {
			clearTimeout(this.pushTimer);
			this.pushTimer = undefined;
		}
		this.latestSnapshot = null;
		if (auth.user && auth.pro && workspace.ready) void this.push(workspace.serialize());
	}

	dismissNudge(): void {
		this.nudge = false;
		try {
			localStorage.setItem('mindmap:nudge-dismissed', Date.now().toString());
		} catch {
			/* storage unavailable */
		}
	}

	private nudgeDismissed(): boolean {
		try {
			return localStorage.getItem('mindmap:nudge-dismissed') !== null;
		} catch {
			return false;
		}
	}

	// Free users: write a lightweight presence marker and check whether another
	// device has synced recently — that is the honest moment to mention Pro.
	private async checkPresence(userId: string): Promise<void> {
		try {
			const deviceId = getDeviceId();
			const { data: existing } = await supabase
				.from('user_meta')
				.select('data')
				.eq('user_id', userId)
				.maybeSingle();
			const data = { ...((existing?.data as Record<string, unknown>) ?? {}), deviceId };
			await supabase.from('user_meta').upsert(
				{ user_id: userId, data, updated_at: Date.now() },
				{ onConflict: 'user_id' }
			);
			const otherDeviceId = (existing?.data as { deviceId?: string } | null)?.deviceId;
			if (otherDeviceId && otherDeviceId !== deviceId && !this.nudgeDismissed()) {
				this.nudge = true;
			}
		} catch {
			/* presence is best-effort */
		}
	}

	private schedulePush(snapshot: ReturnType<typeof workspace.serialize>): void {
		this.latestSnapshot = snapshot;
		if (this.pushTimer) clearTimeout(this.pushTimer);
		this.pushTimer = setTimeout(() => {
			this.pushTimer = undefined;
			const s = this.latestSnapshot;
			this.latestSnapshot = null;
			if (s && auth.user) void this.push(s);
		}, PUSH_DEBOUNCE_MS);
	}

	// Idempotent bootstrap: pulls once per signed-in user (the reactive effect
	// above already handles subsequent pushes).
	refresh(): void {
		const user = auth.user;
		if (user && auth.pro && this.lastUserId !== user.id) {
			this.lastUserId = user.id;
			this.status = 'syncing';
			void this.pull(user.id);
		}
	}

	private async push(snapshot: ReturnType<typeof workspace.serialize>): Promise<void> {
		if (!auth.user) return;
		setTombstoneScope(auth.user.id);
		this.status = 'syncing';

		// Meta (workspace-wide state)
		const meta = {
			user_id: auth.user.id,
			data: {
				activeTabId: snapshot.activeTabId,
				openTabs: snapshot.openTabs,
				folders: snapshot.folders,
				viewMode: snapshot.viewMode,
				activeBoardId: snapshot.activeBoardId,
				deviceId: getDeviceId()
			},
			updated_at: Date.now()
		};

		const rows = buildSyncRows(
			snapshot.maps,
			snapshot.boards,
			getTombstones(),
			auth.user.id,
			Date.now()
		);

		try {
			// Live data first. A failure here is a real sync failure.
			const liveResults = await Promise.all([
				supabase.from('user_meta').upsert(meta, { onConflict: 'user_id' }),
				rows.maps.length > 0
					? supabase.from('user_maps').upsert(rows.maps, { onConflict: 'user_id,id' })
					: Promise.resolve({ error: null }),
				rows.boards.length > 0
					? supabase.from('user_boards').upsert(rows.boards, { onConflict: 'user_id,id' })
					: Promise.resolve({ error: null })
			]);
			const liveError = liveResults.map(resultError).filter(Boolean).join(' ');
			if (liveError) throw new Error(liveError);

			for (const m of rows.maps) this.knownRemoteMapIds.add(m.id);
			for (const b of rows.boards) this.knownRemoteBoardIds.add(b.id);

			// Tombstones last and isolated: a deletion failure must not block the
			// live rows that already synced, and is retried on the next push.
			const [mapTomb, boardTomb] = await Promise.allSettled([
				rows.mapTombstones.length > 0
					? supabase.from('user_maps').upsert(rows.mapTombstones, { onConflict: 'user_id,id' })
					: Promise.resolve({ error: null }),
				rows.boardTombstones.length > 0
					? supabase.from('user_boards').upsert(rows.boardTombstones, { onConflict: 'user_id,id' })
					: Promise.resolve({ error: null })
			]);
			if (!settledFailed(mapTomb)) clearMapDeletes(rows.mapTombstones.map((t) => t.id));
			if (!settledFailed(boardTomb)) clearBoardDeletes(rows.boardTombstones.map((t) => t.id));

			if (settledFailed(mapTomb) || settledFailed(boardTomb)) {
				this.status = 'offline';
				this.error = 'Could not sync deletions';
				return;
			}

			this.status = 'synced';
			this.lastSynced = Date.now();
			this.error = '';
			if (versions.studio) {
				for (const m of snapshot.maps) void versions.maybeSnapshot(m);
				for (const b of snapshot.boards) void versions.maybeSnapshotBoard(b);
			}
		} catch (err) {
			this.status = 'offline';
			this.error = err instanceof Error ? err.message : 'Sync failed';
		}
	}

	private async pull(userId: string): Promise<void> {
		setTombstoneScope(userId);
		try {
			const [mapsRes, boardsRes, metaRes] = await Promise.all([
				supabase.from('user_maps').select('*').eq('user_id', userId),
				supabase.from('user_boards').select('*').eq('user_id', userId),
				supabase.from('user_meta').select('*').eq('user_id', userId).maybeSingle()
			]);
			const maps = (mapsRes.data as RemoteRow[]) ?? [];
			const boards = (boardsRes.data as RemoteRow[]) ?? [];

			// Only live rows are tracked: an existing tombstone already proves the
			// deletion reached the cloud and does not need to be re-sent.
			this.knownRemoteMapIds = new Set(maps.filter((r) => !r.deleted_at).map((r) => r.id));
			this.knownRemoteBoardIds = new Set(boards.filter((r) => !r.deleted_at).map((r) => r.id));

			const remoteHasData = maps.some((m) => !m.deleted_at) || boards.some((b) => !b.deleted_at);

			if (!remoteHasData) {
				// First sign-in with a fresh account: seed with local data.
				if (workspace.ready) this.schedulePush(workspace.serialize());
				this.status = 'synced';
				return;
			}

			// Maps: per-row last-write-wins by updated_at, with pending local
			// tombstones taking precedence until the cloud confirms them.
			for (const row of maps) {
				if (row.deleted_at) {
					if (tombstoneConfirmed(getMapTombstone(row.id), row.deleted_at)) clearMapDelete(row.id);
					const local = workspace.maps.find((m) => m.id === row.id);
					if (local && local.updatedAt < (row.deleted_at ?? 0)) workspace.deleteMap(row.id);
					continue;
				}
				const remote = row.map_data;
				if (!remote) continue;
				if (tombstoneWins(getMapTombstone(row.id), remote.updatedAt)) {
					// This device deleted the map more recently than the cloud row.
					if (workspace.maps.some((m) => m.id === row.id)) workspace.deleteMap(row.id);
					continue;
				}
				if (getMapTombstone(row.id) !== undefined) clearMapDelete(row.id);
				const local = workspace.maps.find((m) => m.id === row.id);
				if (!local) workspace.applyRemoteMap(remote);
				else if (remote.updatedAt > local.updatedAt) workspace.applyRemoteMap(remote);
			}

			// Boards: same semantics.
			for (const row of boards) {
				if (row.deleted_at) {
					if (tombstoneConfirmed(getBoardTombstone(row.id), row.deleted_at)) clearBoardDelete(row.id);
					const local = workspace.boards.find((b) => b.id === row.id);
					if (local && local.updatedAt < (row.deleted_at ?? 0)) workspace.deleteBoard(row.id);
					continue;
				}
				const remote = row.board_data;
				if (!remote) continue;
				if (tombstoneWins(getBoardTombstone(row.id), remote.updatedAt)) {
					if (workspace.boards.some((b) => b.id === row.id)) workspace.deleteBoard(row.id);
					continue;
				}
				if (getBoardTombstone(row.id) !== undefined) clearBoardDelete(row.id);
				const local = workspace.boards.find((b) => b.id === row.id);
				if (!local) workspace.applyRemoteBoard(remote);
				else if (remote.updatedAt > local.updatedAt) workspace.applyRemoteBoard(remote);
			}

			// Meta: union folders + open tabs (never clobbers local selection).
			if (metaRes.data) {
				const data = (metaRes.data as { data?: { folders?: Folder[]; openTabs?: string[] } }).data;
				workspace.applyRemoteMeta({
					folders: data?.folders,
					openTabs: data?.openTabs
				});
			}

			// Push back anything the local device changed more recently than the cloud.
			this.schedulePush(workspace.serialize());
			this.status = 'synced';
			this.lastSynced = Date.now();
			this.error = '';
		} catch (err) {
			this.status = 'offline';
			this.error = err instanceof Error ? err.message : 'Sync failed';
		}
	}
}

export const sync = new SyncState();
