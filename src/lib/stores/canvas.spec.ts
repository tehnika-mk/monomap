import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/stores/ui.svelte', () => ({
	ui: { isCompact: false }
}));

async function freshCanvas(): Promise<typeof import('$lib/stores/canvas.svelte')> {
	return await import('$lib/stores/canvas.svelte');
}

describe('canvas selection', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('selectNode sets a single selection', async () => {
		const { canvas } = await freshCanvas();
		canvas.selectNode('a');
		expect(canvas.selectedNodeId).toBe('a');
		expect(canvas.selectedNodeIds).toEqual(['a']);
		expect(canvas.isSelected('a')).toBe(true);
		expect(canvas.isSelected('b')).toBe(false);
	});

	it('selectNodes sets a multi-selection with an anchor', async () => {
		const { canvas } = await freshCanvas();
		canvas.selectNodes(['a', 'b', 'c'], 'c');
		expect(canvas.selectedNodeIds).toEqual(['a', 'b', 'c']);
		expect(canvas.selectedNodeId).toBe('c');
		expect(canvas.isSelected('b')).toBe(true);
	});

	it('toggleNodeSelection adds and removes nodes, keeping an anchor', async () => {
		const { canvas } = await freshCanvas();
		canvas.selectNodes(['a', 'b'], 'a');
		canvas.toggleNodeSelection('c');
		expect(canvas.selectedNodeIds).toEqual(['a', 'b', 'c']);
		expect(canvas.selectedNodeId).toBe('a');
		canvas.toggleNodeSelection('a');
		expect(canvas.selectedNodeIds).toEqual(['b', 'c']);
		expect(canvas.selectedNodeId).toBe('b');
	});

	it('clearSelection empties both selection fields', async () => {
		const { canvas } = await freshCanvas();
		canvas.selectNodes(['a', 'b'], 'a');
		canvas.clearSelection();
		expect(canvas.selectedNodeId).toBeNull();
		expect(canvas.selectedNodeIds).toEqual([]);
	});
});
