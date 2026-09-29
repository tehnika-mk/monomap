import type { Vec2 } from '$lib/types';

export interface Rect {
	cx: number;
	cy: number;
	w: number;
	h: number;
}

export type EdgeSide = 'left' | 'right' | 'top' | 'bottom';

const MIN_OFFSET = 40;

export function chooseSide(dx: number, dy: number): EdgeSide {
	return Math.abs(dx) >= Math.abs(dy)
		? dx >= 0
			? 'right'
			: 'left'
		: dy >= 0
			? 'bottom'
			: 'top';
}

export function anchorOn(rect: Rect, side: EdgeSide): Vec2 {
	switch (side) {
		case 'right':
			return { x: rect.cx + rect.w / 2, y: rect.cy };
		case 'left':
			return { x: rect.cx - rect.w / 2, y: rect.cy };
		case 'bottom':
			return { x: rect.cx, y: rect.cy + rect.h / 2 };
		case 'top':
			return { x: rect.cx, y: rect.cy - rect.h / 2 };
	}
}

function opposite(side: EdgeSide): EdgeSide {
	switch (side) {
		case 'right':
			return 'left';
		case 'left':
			return 'right';
		case 'top':
			return 'bottom';
		case 'bottom':
			return 'top';
	}
}

// Connect two node rectangles with a cubic bezier. Anchors are chosen from the
// dominant direction so links attach to whichever side faces the other node and
// adapt as nodes are dragged anywhere on the canvas.
export function calculateBezierPath(parent: Rect, child: Rect): string {
	const dx = child.cx - parent.cx;
	const dy = child.cy - parent.cy;
	const side = chooseSide(dx, dy);
	const start = anchorOn(parent, side);
	const end = anchorOn(child, opposite(side));

	const horizontal = side === 'left' || side === 'right';
	const dir = side === 'right' || side === 'bottom' ? 1 : -1;

	let c1: Vec2;
	let c2: Vec2;
	if (horizontal) {
		const offset = Math.max(Math.abs(end.x - start.x) / 2, MIN_OFFSET);
		c1 = { x: start.x + dir * offset, y: start.y };
		c2 = { x: end.x - dir * offset, y: end.y };
	} else {
		const offset = Math.max(Math.abs(end.y - start.y) / 2, MIN_OFFSET);
		c1 = { x: start.x, y: start.y + dir * offset };
		c2 = { x: end.x, y: end.y - dir * offset };
	}

	return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
}
