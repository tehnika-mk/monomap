import { expect, test, type Page } from '@playwright/test';
import { nodeByText } from './helpers';

async function openMap(page: Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

test('switches between mind map and kanban workspaces', async ({ page }) => {
	await openMap(page);

	await page.locator('.switch button', { hasText: 'Kanban' }).click();
	await expect(page.getByText('No board open')).toBeVisible();

	await page.keyboard.press('Control+k');
	await expect(nodeByText(page, 'Central idea')).toBeVisible();

	await page.keyboard.press('Control+k');
	await expect(page.getByText('No board open')).toBeVisible();
});

test('creates a board, columns and cards from the UI', async ({ page }) => {
	await openMap(page);

	await page.locator('.switch button', { hasText: 'Kanban' }).click();
	await page.getByText('New Kanban Board').click();
	await expect(page.locator('.board-title')).toHaveText('Untitled Board');

	await page.locator('.add-col').click();
	await expect(page.locator('.col')).toHaveCount(2);

	const col2 = page.locator('.col').nth(1);
	await col2.locator('.col-title').dblclick();
	const titleInput = col2.locator('.head-input');
	await titleInput.fill('Doing');
	await titleInput.press('Enter');
	await expect(col2.locator('.col-title')).toHaveText('Doing');

	await col2.locator('.add-card').click();
	const cardInput = col2.locator('.card-input');
	await expect(cardInput).toBeVisible();
	await cardInput.fill('Ship it');
	await cardInput.press('Enter');
	await expect(page.locator('[data-card]').filter({ hasText: 'Ship it' })).toBeVisible();
});

test('the column menu closes when clicking elsewhere', async ({ page }) => {
	await openMap(page);
	await page.evaluate(() => window.__mindmap!.workspace.createBoard('Flow'));
	await expect(page.locator('.col')).toHaveCount(1);

	await page.locator('.col .menu-btn').first().click();
	await expect(page.locator('.col .menu')).toBeVisible();

	await page.locator('.board-title').click();
	await expect(page.locator('.col .menu')).toHaveCount(0);
});

test('duplicates a board from the sidebar menu', async ({ page }) => {
	await openMap(page);
	await page.evaluate(() => window.__mindmap!.workspace.createBoard('Docs'));

	const row = page.locator('.board-row', { hasText: 'Docs' });
	await row.getByRole('button', { name: 'Actions for Docs', exact: true }).click();
	await page.getByRole('button', { name: 'Duplicate', exact: true }).click();

	await expect(page.locator('.board-title')).toHaveText('Docs (copy)');
	await expect(page.locator('.board-row').filter({ hasText: 'Docs (copy)' })).toBeVisible();
});

test('double-clicking a card renames it inline', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Flow');
		w.createCard(b.id, b.columns[0].id, 'Rename me');
	});
	await expect(page.locator('[data-card]')).toHaveCount(1);

	await page.locator('[data-card]').dblclick();
	const input = page.locator('input.rename-input');
	await expect(input).toBeVisible();
	await input.fill('Renamed card');
	await input.press('Enter');
	await expect(page.locator('[data-card] .title')).toHaveText('Renamed card');
});

test('moves cards between columns with drag and drop', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Flow');
		w.renameColumn(b.id, b.columns[0].id, 'Todo');
		w.addColumn(b.id, 'Done');
		w.createCard(b.id, b.columns[0].id, 'Card A');
		w.createCard(b.id, b.columns[0].id, 'Card B');
	});
	await expect(page.locator('.col')).toHaveCount(2);
	await expect(page.locator('[data-card]')).toHaveCount(2);

	// Drag Card A into the Done column.
	const source = page.locator('[data-card]').filter({ hasText: 'Card A' });
	const done = page.locator('.col').nth(1);
	const sb = await source.boundingBox();
	const db = await done.boundingBox();
	await page.mouse.move(sb!.x + sb!.width / 2, sb!.y + sb!.height / 2);
	await page.mouse.down();
	await page.mouse.move(db!.x + 40, db!.y + 40, { steps: 10 });
	await page.mouse.up();

	await expect
		.poll(() =>
			page.evaluate(() => window.__mindmap!.workspace.getActiveBoard()!.columns[1].cards.map((c) => c.title))
		)
		.toEqual(['Card A']);
});

test('filters cards by keyword and label color', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Search');
		w.createCard(b.id, b.columns[0].id, 'Fix the login bug');
		const staged = w.createCard(b.id, b.columns[0].id, 'Deploy to staging');
		w.addCardLabel(b.id, staged.id, { text: 'bug', color: '#ef4444' });
	});
	await expect(page.locator('[data-card]')).toHaveCount(2);

	const filter = page.locator('input[aria-label="Filter cards"]');
	await filter.fill('login');
	await expect(page.locator('[data-card]:visible')).toHaveCount(1);

	await filter.fill('ef4444');
	await expect(page.locator('[data-card]:visible')).toHaveCount(1);

	await filter.fill('zzz');
	await expect(page.locator('[data-card]:visible')).toHaveCount(0);

	await page.getByRole('button', { name: 'Clear filter' }).click();
	await expect(page.locator('[data-card]:visible')).toHaveCount(2);
});

test('sends a mind map node to a kanban board and navigates back', async ({ page }) => {
	await openMap(page);

	await nodeByText(page, 'Central idea').click();
	const panel = page.getByRole('complementary', { name: 'Node settings' });
	await expect(panel).toBeVisible();

	await panel.getByRole('button', { name: 'Send to Kanban Board' }).click();
	await expect(page.locator('.board-title')).toHaveText('Your First Map Board');
	const editor = page.getByRole('complementary', { name: 'Card editor' });
	await expect(editor).toBeVisible();
	await expect(editor.locator('.title-input')).toHaveValue('Central idea');
	await expect(editor.locator('.check-row')).toHaveCount(2);

	// Jump back to the source node from the card face.
	await editor.locator('.close').click();
	await page.locator('.map-link').click();
	await expect(nodeByText(page, 'Central idea')).toBeVisible();
	await expect(panel).toBeVisible();
	await expect(panel.getByRole('button', { name: 'Open on Board ↗' })).toBeVisible();
});

test('map link centers the mind map on the linked node even when starting hidden', async ({ page }) => {
	await openMap(page);

	// Link the root node to a card and switch to the kanban workspace.
	await nodeByText(page, 'Central idea').click();
	const panel = page.getByRole('complementary', { name: 'Node settings' });
	await expect(panel).toBeVisible();
	await panel.getByRole('button', { name: 'Send to Kanban Board' }).click();
	await expect(page.locator('.board-title')).toHaveText('Your First Map Board');
	await page.getByRole('button', { name: 'Close card editor' }).click();

	// Simulate a stale zero-size viewport (as when the mind map canvas starts
	// hidden) and then jump back via the card's map link.
	await page.evaluate(() => {
		const c = window.__mindmap!.canvas;
		c.viewport = { width: 0, height: 0 };
		c.x = -500;
		c.y = -500;
		c.pendingCenterId = null;
	});
	await page.locator('.map-link').click();
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
	await page.waitForFunction(() => {
		const c = window.__mindmap!.canvas;
		return c.viewport.width > 0 && c.viewport.height > 0 && c.pendingCenterId === null && c.zoom === 1;
	});
	const state = await page.evaluate(() => {
		const c = window.__mindmap!.canvas;
		return { x: c.x, y: c.y, viewport: c.viewport };
	});
	expect(state.x).toBeCloseTo(state.viewport.width / 2, 0);
	expect(state.y).toBeCloseTo(state.viewport.height / 2, 0);
});

test('generates a board from a mind map branch', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const map = w.getActiveMap()!;
		w.createChild(map.rootNode.children[0].id, 'Sub A');
	});

	await nodeByText(page, 'Central idea').click();
	const panel = page.getByRole('complementary', { name: 'Node settings' });
	await expect(panel).toBeVisible();

	await panel.getByRole('button', { name: 'Generate Board from Branch' }).click();
	await expect(page.locator('.board-title')).toHaveText('Central idea');
	await expect(page.locator('.col')).toHaveCount(2);
	await expect(page.locator('[data-card]').filter({ hasText: 'Sub A' })).toBeVisible();
});

test('marks a card complete and hides completed cards', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Flow');
		w.createCard(b.id, b.columns[0].id, 'Ship it');
	});
	const card = page.locator('[data-card]');
	await expect(card).toHaveCount(1);

	await card.hover();
	await card.locator('.check').click();
	await expect(card).toHaveClass(/completed/);
	await expect
		.poll(() => page.evaluate(() => window.__mindmap!.workspace.getActiveBoard()!.columns[0].cards[0].completed))
		.toBe(true);

	await page.getByRole('button', { name: 'Hide done' }).click();
	await expect(page.locator('[data-card]:visible')).toHaveCount(0);

	await page.getByRole('button', { name: 'Show done' }).click();
	await expect(page.locator('[data-card]:visible')).toHaveCount(1);
});

test('deletes a card from its menu and undoes it', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Flow');
		w.createCard(b.id, b.columns[0].id, 'Keep');
		w.createCard(b.id, b.columns[0].id, 'Remove');
	});
	await expect(page.locator('[data-card]')).toHaveCount(2);

	const card = page.locator('[data-card]').filter({ hasText: 'Remove' });
	await card.hover();
	await card.locator('.menu-btn').click();
	await page.getByRole('menuitem', { name: 'Delete' }).click();
	await expect(page.locator('[data-card]')).toHaveCount(1);

	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(page.locator('[data-card]')).toHaveCount(2);
	await expect(page.locator('[data-card]').filter({ hasText: 'Remove' })).toBeVisible();
});

test('completes and deletes a card from the editor panel', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Flow');
		w.createCard(b.id, b.columns[0].id, 'Solo');
	});
	await page.locator('[data-card]').click();

	const editor = page.getByRole('complementary', { name: 'Card editor' });
	await expect(editor).toBeVisible();
	await editor.getByRole('button', { name: 'Mark complete' }).click();
	await expect
		.poll(() => page.evaluate(() => window.__mindmap!.workspace.getActiveBoard()!.columns[0].cards[0].completed))
		.toBe(true);

	await editor.getByRole('button', { name: 'Delete card' }).click();
	await expect(page.locator('[data-card]')).toHaveCount(0);
	await expect(editor).toHaveCount(0);
});

test('dragging a column grip reorders it rightward by exactly one slot', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Flow');
		w.renameColumn(b.id, b.columns[0].id, 'A');
		w.addColumn(b.id, 'B');
		w.addColumn(b.id, 'C');
	});
	await expect(page.locator('.col')).toHaveCount(3);

	const colA = page.locator('.col').nth(0);
	const grip = colA.locator('.grip');
	const gb = (await grip.boundingBox())!;
	const colB = (await page.locator('.col').nth(1).boundingBox())!;
	const y = gb.y + gb.height / 2;
	// Past B's midpoint but before C's → insert index 2 in the pre-removal array.
	const targetX = colB.x + colB.width * 0.75;

	await page.mouse.move(gb.x + gb.width / 2, y);
	await page.mouse.down();
	await page.mouse.move(targetX, y, { steps: 10 });

	// The between-columns indicator is shown while dragging a column.
	await expect(page.locator('.col-drop')).toBeVisible();

	await page.mouse.up();

	await expect
		.poll(() =>
			page.evaluate(() => window.__mindmap!.workspace.getActiveBoard()!.columns.map((c) => c.title))
		)
		.toEqual(['B', 'A', 'C']);
});

test('column drag previews the whole column with its cards', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Flow');
		w.renameColumn(b.id, b.columns[0].id, 'A');
		w.createCard(b.id, b.columns[0].id, 'Alpha');
		w.createCard(b.id, b.columns[0].id, 'Beta');
		w.addColumn(b.id, 'B');
	});
	await expect(page.locator('[data-card]')).toHaveCount(2);

	const colA = page.locator('.col').nth(0);
	const grip = colA.locator('.grip');
	const gb = (await grip.boundingBox())!;

	await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
	await page.mouse.down();
	await page.mouse.move(gb.x + 70, gb.y + gb.height / 2, { steps: 8 });

	const ghost = page.locator('.col-ghost');
	await expect(ghost).toBeVisible();
	await expect(ghost).toContainText('Alpha');
	await expect(ghost).toContainText('Beta');
	// The ghost must not inject drag targets into the hit-test geometry.
	await expect(page.locator('[data-column]')).toHaveCount(2);
	await expect(page.locator('[data-card]')).toHaveCount(2);

	await page.mouse.up();
});

test('drops a card after a hidden completed card without an off-by-one', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => {
		const w = window.__mindmap!.workspace;
		const b = w.createBoard('Flow');
		const colId = b.columns[0].id;
		w.renameColumn(b.id, colId, 'A');
		w.createCard(b.id, colId, 'X');
		const y = w.createCard(b.id, colId, 'Y')!;
		w.createCard(b.id, colId, 'Z');
		w.toggleCardComplete(b.id, y.id);
		window.__mindmap!.kanban.showCompleted = false;
	});
	await expect(page.locator('[data-card]:visible')).toHaveCount(2);

	const cardX = page.locator('[data-card]').filter({ hasText: 'X' });
	const xb = (await cardX.boundingBox())!;
	const colA = (await page.locator('.col').nth(0).boundingBox())!;

	await page.mouse.move(xb.x + xb.width / 2, xb.y + xb.height / 2);
	await page.mouse.down();
	await page.mouse.move(colA.x + colA.width / 2, colA.y + colA.height - 24, { steps: 12 });
	await page.mouse.up();

	await expect
		.poll(() =>
			page.evaluate(() =>
				window.__mindmap!.workspace.getActiveBoard()!.columns[0].cards.map((c) => c.title)
			)
		)
		.toEqual(['Y', 'Z', 'X']);
});
