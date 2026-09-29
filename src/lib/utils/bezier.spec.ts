import { describe, expect, it } from 'vitest';
import { calculateBezierPath, chooseSide, type Rect } from './bezier';

function rect(cx: number, cy: number, w = 0, h = 0): Rect {
	return { cx, cy, w, h };
}

describe('chooseSide', () => {
	it('prefers horizontal anchors for mostly horizontal deltas', () => {
		expect(chooseSide(240, 30)).toBe('right');
		expect(chooseSide(-240, 30)).toBe('left');
	});

	it('uses vertical anchors when the child is mostly above or below', () => {
		expect(chooseSide(20, 200)).toBe('bottom');
		expect(chooseSide(20, -200)).toBe('top');
	});
});

describe('calculateBezierPath', () => {
	it('produces a cubic bezier from the parent right edge to the child left edge', () => {
		expect(calculateBezierPath(rect(0, 0), rect(240, 0))).toBe('M 0 0 C 120 0, 120 0, 240 0');
	});

	it('applies a minimum control offset for close nodes', () => {
		expect(calculateBezierPath(rect(0, 0), rect(10, 0))).toBe('M 0 0 C 40 0, -30 0, 10 0');
	});

	it('routes vertically (parent above child)', () => {
		expect(calculateBezierPath(rect(0, 0), rect(0, 100))).toBe('M 0 0 C 0 50, 0 50, 0 100');
	});

	it('routes vertically upward (child above parent)', () => {
		expect(calculateBezierPath(rect(0, 0), rect(0, -100))).toBe('M 0 0 C 0 -50, 0 -50, 0 -100');
	});

	it('reverses direction when the child is left of the parent', () => {
		expect(calculateBezierPath(rect(240, 0), rect(0, 0))).toBe('M 240 0 C 120 0, 120 0, 0 0');
	});

	it('accounts for node sizes when choosing anchor edges', () => {
		expect(calculateBezierPath(rect(0, 0, 100, 40), rect(240, 0, 100, 40))).toBe(
			'M 50 0 C 120 0, 120 0, 190 0'
		);
	});
});
