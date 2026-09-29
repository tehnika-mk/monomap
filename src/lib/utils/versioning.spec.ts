import { describe, expect, it } from 'vitest';
import type { KanbanBoard } from '$lib/types';
import {
	countBoardCards,
	pruneVersionRows,
	shouldSnapshotMap,
	versionTimestamp,
	MAX_VERSIONS_PER_MAP,
	SNAPSHOT_INTERVAL_MS
} from './versioning';

describe('shouldSnapshotMap', () => {
	const base = { now: 10_000_000, mapUpdatedAt: 5_000 };

	it('snapshots a map that was never snapshotted', () => {
		expect(
			shouldSnapshotMap({ ...base, lastSnapshotAt: undefined, lastSnapshottedUpdatedAt: undefined })
		).toBe(true);
	});

	it('skips an unchanged map', () => {
		expect(
			shouldSnapshotMap({
				...base,
				lastSnapshotAt: base.now - SNAPSHOT_INTERVAL_MS - 1,
				lastSnapshottedUpdatedAt: base.mapUpdatedAt
			})
		).toBe(false);
	});

	it('respects the interval for changed maps', () => {
		expect(
			shouldSnapshotMap({
				...base,
				lastSnapshotAt: base.now - SNAPSHOT_INTERVAL_MS + 1000,
				lastSnapshottedUpdatedAt: 4_000
			})
		).toBe(false);
		expect(
			shouldSnapshotMap({
				...base,
				lastSnapshotAt: base.now - SNAPSHOT_INTERVAL_MS - 1,
				lastSnapshottedUpdatedAt: 4_000
			})
		).toBe(true);
	});

	it('honours a custom interval', () => {
		expect(
			shouldSnapshotMap({
				...base,
				lastSnapshotAt: base.now - 5000,
				lastSnapshottedUpdatedAt: 4_000,
				intervalMs: 4000
			})
		).toBe(true);
	});
});

describe('pruneVersionRows', () => {
	const rows = (n: number) =>
		Array.from({ length: n }, (_, i) => ({ id: `v${n - i}`, created_at: n - i }));

	it('returns nothing when under the cap', () => {
		const list = rows(3);
		expect(pruneVersionRows(list, MAX_VERSIONS_PER_MAP)).toEqual([]);
	});

	it('keeps the newest cap and flags older rows', () => {
		const list = rows(MAX_VERSIONS_PER_MAP + 2);
		const stale = pruneVersionRows(list, MAX_VERSIONS_PER_MAP);
		expect(stale).toHaveLength(2);
		expect(stale.map((r) => r.id)).toEqual(['v2', 'v1']);
	});
});

describe('countBoardCards', () => {
	it('sums cards across all columns', () => {
		const board = {
			columns: [
				{ cards: [{}, {}, {}] },
				{ cards: [{}] },
				{ cards: [] }
			]
		} as unknown as KanbanBoard;
		expect(countBoardCards(board)).toBe(4);
	});
});

describe('versionTimestamp', () => {
	it('derives a stable version number from the timestamp', () => {
		const now = 1_777_777_777_123;
		const { version, created_at } = versionTimestamp(now);
		expect(created_at).toBe(now);
		expect(version).toBe(Math.floor(now / 1000));
	});
});
