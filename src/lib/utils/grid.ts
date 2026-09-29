// Shared by the canvas background dots and the snap-to-grid preference so both
// use the exact same spacing.
export const GRID_SPACING = 26;

export function snapToGrid(value: number, spacing = GRID_SPACING): number {
	if (spacing <= 0) return value;
	const snapped = Math.round(value / spacing) * spacing;
	// Normalise -0 to 0 so snapped positions compare predictably.
	return snapped === 0 ? 0 : snapped;
}

export interface DragOrigin {
	id: string;
	origin: { x: number; y: number };
}

// Compute absolute drag targets from each node's original position and the
// total pointer delta. Snapping the target (not each frame's delta) keeps slow
// drags smooth: sub-grid motion accumulates instead of rounding away.
export function dragTargets(
	origins: DragOrigin[],
	dx: number,
	dy: number,
	snap: boolean
): Array<{ id: string; position: { x: number; y: number } }> {
	return origins.map(({ id, origin }) => {
		let x = origin.x + dx;
		let y = origin.y + dy;
		if (snap) {
			x = snapToGrid(x);
			y = snapToGrid(y);
		}
		return { id, position: { x, y } };
	});
}
