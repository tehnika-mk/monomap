import { clear } from 'idb-keyval';

const TOMBSTONE_PREFIX = 'mindmap:sync-tombstones';
const EXTRA_KEYS = ['mindmap:device-id', 'mindmap:nudge-dismissed'];

export function isLocalAccountKey(key: string): boolean {
	return (
		key === TOMBSTONE_PREFIX ||
		key.startsWith(`${TOMBSTONE_PREFIX}:`) ||
		EXTRA_KEYS.includes(key)
	);
}

// Wipe local account data after the cloud account is deleted: the IndexedDB
// workspace plus deletion tombstones and device markers. UI preferences (theme,
// background dots, snap) are intentionally kept since they are device settings.
export async function clearLocalData(): Promise<void> {
	try {
		await clear();
	} catch {
		/* storage unavailable */
	}
	if (typeof localStorage === 'undefined') return;
	const doomed: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && isLocalAccountKey(key)) doomed.push(key);
	}
	for (const key of doomed) {
		try {
			localStorage.removeItem(key);
		} catch {
			/* storage unavailable */
		}
	}
}
