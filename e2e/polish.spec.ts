import { expect, test } from '@playwright/test';
import { nodeByText, openSettings } from './helpers';

async function openMap(page: import('@playwright/test').Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

test('dotted grid can be toggled from preferences', async ({ page }) => {
	await openMap(page);

	const canvasRoot = page.locator('.canvas-root');
	await expect(canvasRoot).toHaveCSS('background-image', /radial-gradient/);

	const prefs = await openSettings(page, 'Preferences');
	await expect(prefs).toBeVisible();

	await prefs.getByRole('button', { name: 'Dots' }).click();
	await expect(canvasRoot).toHaveCSS('background-image', 'none');

	await prefs.getByRole('button', { name: 'Dots' }).click();
	await expect(canvasRoot).toHaveCSS('background-image', /radial-gradient/);
});

test('theme toggle switches dark mode and persists across reload', async ({ page }) => {
	await openMap(page);

	const html = page.locator('html');
	await expect(html).not.toHaveClass(/dark/);

	const prefs = await openSettings(page, 'Preferences');
	await expect(prefs).toBeVisible();

	await prefs.getByRole('button', { name: 'Dark mode' }).click();
	await expect(html).toHaveClass(/dark/);
	expect(await page.evaluate(() => localStorage.getItem('mindmap:theme'))).toBe('dark');

	await page.reload();
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
	await expect(page.locator('html')).toHaveClass(/dark/);
});

test('shortcuts bar shows a fresh-map tip and hides it after adding a node', async ({ page }) => {
	await openMap(page);

	// a brand-new map (single root node) shows the tip
	await page.keyboard.press('Control+t');
	const tip = page.locator('.bar .item').filter({ hasText: 'to add a node' });
	await expect(tip).toBeVisible();

	await page.keyboard.press('Tab');
	await expect(tip).not.toBeVisible();
});

test('snap to grid toggles, persists and snaps dragged nodes', async ({ page }) => {
	await openMap(page);

	const prefs = await openSettings(page, 'Preferences');
	await prefs.getByRole('button', { name: 'Snap to grid' }).click();
	expect(await page.evaluate(() => localStorage.getItem('mindmap:snap'))).toBe('true');
	await prefs.getByRole('button', { name: 'Close' }).click();

	const node = nodeByText(page, 'Node 1');
	const box = await node.boundingBox();
	await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
	await page.mouse.down();
	await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2 + 30, { steps: 8 });
	await page.mouse.up();

	const position = await page.evaluate(
		() => window.__mindmap!.workspace.getActiveMap()!.rootNode.children[0].position
	);
	expect(position.x % 26).toBe(0);
	expect(position.y % 26).toBe(0);

	await page.reload();
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
	expect(await page.evaluate(() => localStorage.getItem('mindmap:snap'))).toBe('true');
});

test('help tutorial opens from preferences', async ({ page }) => {
	await openMap(page);

	const prefs = await openSettings(page, 'Preferences');
	await prefs.getByRole('button', { name: 'Help & tutorial' }).click();

	const help = page.getByRole('dialog', { name: 'Help and tutorial' });
	await expect(help).toBeVisible();
	await help.getByRole('tab', { name: 'Shortcuts' }).click();
	await expect(help.getByText('Center on root')).toBeVisible();
});

test('Ctrl+0 recenters on the root node', async ({ page }) => {
	await openMap(page);

	await page.evaluate(() => window.__mindmap!.canvas.panBy(400, 300));
	const before = await page.evaluate(() => {
		const c = window.__mindmap!.canvas;
		return { x: c.x, y: c.y };
	});

	await page.keyboard.press('Control+0');

	const after = await page.evaluate(() => {
		const c = window.__mindmap!.canvas;
		return { x: c.x, y: c.y, zoom: c.zoom };
	});
	const viewport = await page.evaluate(() => window.__mindmap!.canvas.viewport);
	expect(after.x).not.toBe(before.x);
	expect(after.zoom).toBe(1);
	expect(after.x).toBeCloseTo(viewport.width / 2, 0);
	expect(after.y).toBeCloseTo(viewport.height / 2, 0);
});
