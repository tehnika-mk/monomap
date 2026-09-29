import { describe, expect, it } from 'vitest';
import { dragTargets, GRID_SPACING, snapToGrid } from './grid';

describe('dragTargets', () => {
	const origins = [
		{ id: 'a', origin: { x: 100, y: 200 } },
		{ id: 'b', origin: { x: -50, y: 0 } }
	];

	it('offsets every node by the total delta when snapping is off', () => {
		expect(dragTargets(origins, 10, -20, false)).toEqual([
			{ id: 'a', position: { x: 110, y: 180 } },
			{ id: 'b', position: { x: -40, y: -20 } }
		]);
	});

	it('snaps the accumulated target, not the per-frame delta', () => {
		const origin = [{ id: 'a', origin: { x: 0, y: 0 } }];
		// A slow drag that has not yet crossed half a cell stays put...
		expect(dragTargets(origin, 12, 12, true)[0].position).toEqual({ x: 0, y: 0 });
		// ...and only once it passes the midpoint does it hop to the next cell.
		expect(dragTargets(origin, 14, 14, true)[0].position).toEqual({
			x: GRID_SPACING,
			y: GRID_SPACING
		});
	});

	it('snaps each selected node relative to its own origin', () => {
		const result = dragTargets(origins, 3, 4, true);
		expect(result.find((t) => t.id === 'a')!.position).toEqual({ x: 104, y: 208 });
	});
});

describe('snapToGrid', () => {
	it('rounds to the nearest grid intersection', () => {
		expect(snapToGrid(0)).toBe(0);
		expect(snapToGrid(12)).toBe(0);
		expect(snapToGrid(14)).toBe(GRID_SPACING);
		expect(snapToGrid(39)).toBe(GRID_SPACING * 2);
	});

	it('snaps negative coordinates symmetrically', () => {
		expect(snapToGrid(-14)).toBe(-GRID_SPACING);
		expect(snapToGrid(-12)).toBe(0);
	});

	it('accepts a custom spacing and ignores invalid spacing', () => {
		expect(snapToGrid(23, 10)).toBe(20);
		expect(snapToGrid(23, 0)).toBe(23);
	});
});
