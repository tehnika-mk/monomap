import { describe, expect, it } from 'vitest';
import { cardDropTarget, columnInsertIndex, type DropColumn } from './kanbanDrop';

function col(
	id: string,
	x: number,
	w: number,
	cards: Array<{ id: string; y: number; h: number; dataIndex?: number }>
): DropColumn {
	return {
		id,
		rect: { left: x, right: x + w, top: 0, bottom: 1000, width: w, height: 1000 },
		cards: cards.map((c, i) => ({
			id: c.id,
			dataIndex: c.dataIndex ?? i,
			rect: { left: x, right: x + w, top: c.y, bottom: c.y + c.h, width: w, height: c.h }
		})),
		dataLength: cards.length
	};
}

const columns = [
	col('c1', 0, 280, [
		{ id: 'a', y: 10, h: 60 },
		{ id: 'b', y: 80, h: 60 }
	]),
	col('c2', 300, 280, [{ id: 'c', y: 10, h: 60 }])
];

describe('cardDropTarget', () => {
	it('targets the column under the pointer', () => {
		const t = cardDropTarget(columns, 350, 100);
		expect(t.columnId).toBe('c2');
	});

	it('computes insertion index from card midpoints', () => {
		// Above card b (mid y=110) → insert before b → index 1 in c1
		const t1 = cardDropTarget(columns, 100, 105);
		expect(t1.columnId).toBe('c1');
		expect(t1.index).toBe(1);
		// Below card b → index 2 (end)
		const t2 = cardDropTarget(columns, 100, 150);
		expect(t2.index).toBe(2);
	});

	it('inserts before the first card when above everything', () => {
		const t = cardDropTarget(columns, 100, 0);
		expect(t.columnId).toBe('c1');
		expect(t.index).toBe(0);
	});

	it('inserts at the data length when below everything', () => {
		const t = cardDropTarget(columns, 100, 999);
		expect(t.columnId).toBe('c1');
		expect(t.index).toBe(2);
	});

	it('falls back to the nearest column when between columns', () => {
		const t = cardDropTarget(columns, 290, 100);
		expect(t.columnId).toBe('c1');
	});

	it('keeps data indices correct when cards are hidden', () => {
		// Data: [a, b(hidden), c]. Below the last visible card the drop must land
		// at data index 3 (after c), not 2 (which would be before the hidden b).
		const withHidden = [
			col('c1', 0, 280, [
				{ id: 'a', y: 10, h: 60, dataIndex: 0 },
				{ id: 'b', y: 0, h: 0, dataIndex: 1 },
				{ id: 'c', y: 80, h: 60, dataIndex: 2 }
			])
		];
		(withHidden[0] as DropColumn).dataLength = 3;

		// Above a → before a at data index 0
		expect(cardDropTarget(withHidden, 100, 0).index).toBe(0);
		// Between a and c → before c at data index 2
		expect(cardDropTarget(withHidden, 100, 70).index).toBe(2);
		// Below c → end at data index 3
		expect(cardDropTarget(withHidden, 100, 200).index).toBe(3);
	});

	it('has no cards to count in an empty column', () => {
		const empty = [col('c1', 0, 280, [])];
		expect(cardDropTarget(empty, 100, 50)).toEqual({ columnId: 'c1', index: 0 });
	});
});

describe('columnInsertIndex', () => {
	it('returns the insert index by column midpoints', () => {
		// c2 mid = 440; pointer left of it → 1 (insert before c2)
		expect(columnInsertIndex(columns, 400)).toBe(1);
		// past c2 mid → 2 (insert after c2)
		expect(columnInsertIndex(columns, 500)).toBe(2);
		// far left → 0
		expect(columnInsertIndex(columns, 0)).toBe(0);
	});
});
