// Durable deletion markers. Kept in localStorage (synchronous) so a deletion
// survives an immediate refresh even when the debounced cloud push has not run
// yet. Markers are scoped per account so one user's deletions never affect
// another on the same browser. The cloud is reconciled from these on the next
// pull/push.
export interface Tombstones {
	maps: Record<string, number>;
	boards: Record<string, number>;
}

const KEY = 'mindmap:sync-tombstones';

const EMPTY: Tombstones = { maps: {}, boards: {} };

let scope = '';
let state: Tombstones = { maps: {}, boards: {} };

function storageAvailable(): boolean {
	try {
		return typeof window !== 'undefined' && !!window.localStorage;
	} catch {
		return false;
	}
}

function storageKey(): string {
	return scope ? `${KEY}:${scope}` : KEY;
}

function load(key: string): Tombstones {
	if (!storageAvailable()) return { maps: {}, boards: {} };
	try {
		const raw = window.localStorage.getItem(key);
		if (!raw) return { maps: {}, boards: {} };
		const parsed = JSON.parse(raw) as Partial<Tombstones>;
		return { maps: parsed.maps ?? {}, boards: parsed.boards ?? {} };
	} catch {
		return { maps: {}, boards: {} };
	}
}

function persist(): void {
	if (!storageAvailable()) return;
	try {
		window.localStorage.setItem(storageKey(), JSON.stringify(state));
	} catch {
		/* storage unavailable */
	}
}

// Switch to the given account's markers. Must be called before reading/writing
// so markers never cross accounts.
export function setTombstoneScope(userId: string | null): void {
	const next = userId ?? '';
	if (next === scope) return;
	scope = next;
	state = next ? load(storageKey()) : { ...EMPTY };
}

export function getTombstones(): Tombstones {
	return { maps: { ...state.maps }, boards: { ...state.boards } };
}

export function getMapTombstone(id: string): number | undefined {
	return state.maps[id];
}

export function getBoardTombstone(id: string): number | undefined {
	return state.boards[id];
}

export function recordMapDelete(id: string, ts = Date.now()): void {
	state.maps[id] = ts;
	persist();
}

export function recordBoardDelete(id: string, ts = Date.now()): void {
	state.boards[id] = ts;
	persist();
}

export function clearMapDelete(id: string): void {
	if (id in state.maps) {
		delete state.maps[id];
		persist();
	}
}

export function clearBoardDelete(id: string): void {
	if (id in state.boards) {
		delete state.boards[id];
		persist();
	}
}

export function clearMapDeletes(ids: Iterable<string>): void {
	let changed = false;
	for (const id of ids) {
		if (id in state.maps) {
			delete state.maps[id];
			changed = true;
		}
	}
	if (changed) persist();
}

export function clearBoardDeletes(ids: Iterable<string>): void {
	let changed = false;
	for (const id of ids) {
		if (id in state.boards) {
			delete state.boards[id];
			changed = true;
		}
	}
	if (changed) persist();
}
