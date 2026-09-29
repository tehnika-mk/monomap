import { expect, test, type Page } from '@playwright/test';
import { nodeByText } from './helpers';

async function openMap(page: Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

async function becomeStudio(page: Page) {
	await page.evaluate(() => {
		const m = window.__mindmap!;
		const future = new Date(Date.now() + 30 * 86_400_000).toISOString();
		m.auth.user = { id: 'test-user-id', email: 'test@example.com' };
		m.auth.profile = {
			user_id: 'test-user-id',
			email: 'test@example.com',
			plan: 'studio',
			agentaos_subscription_id: null,
			current_period_end: future,
			cancel_at_period_end: false,
			updated_at: new Date().toISOString()
		};
	});
}

async function becomeFree(page: Page) {
	await page.evaluate(() => {
		const m = window.__mindmap!;
		m.auth.user = { id: 'test-user-id', email: 'test@example.com' };
		m.auth.profile = {
			user_id: 'test-user-id',
			email: 'test@example.com',
			plan: 'free',
			agentaos_subscription_id: null,
			current_period_end: null,
			cancel_at_period_end: false,
			updated_at: new Date().toISOString()
		};
	});
}

test('the studio deep link opens the sign-in modal and cleans the URL', async ({ page }) => {
	await page.goto('/workspace?upgrade=1&tier=studio');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });

	const dialog = page.getByRole('dialog', { name: 'Account' });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('heading', { name: 'Sign in' })).toBeVisible();

	await expect(page).toHaveURL(/\/workspace$/);
});

test('version history shows the Studio upsell for free users', async ({ page }) => {
	await openMap(page);
	await becomeFree(page);

	await page.getByRole('button', { name: 'Actions for Your First Map', exact: true }).click();
	await page.getByRole('button', { name: 'Version history…', exact: true }).click();

	const dialog = page.getByRole('dialog', { name: 'Version history' });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByText(/part of/)).toContainText('Studio');
	await expect(dialog.getByRole('button', { name: /Upgrade to Studio/ })).toBeVisible();
});

test('board version history shows the Studio upsell for free users', async ({ page }) => {
	await openMap(page);
	await becomeFree(page);

	await page.evaluate(() => window.__mindmap!.workspace.createBoard('History Board'));
	const row = page.locator('.board-row', { hasText: 'History Board' });
	await row.getByRole('button', { name: 'Actions for History Board', exact: true }).click();
	await page.getByRole('button', { name: 'Version history…', exact: true }).click();

	const dialog = page.getByRole('dialog', { name: 'Version history' });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('button', { name: /Upgrade to Studio/ })).toBeVisible();
});

test('version history lists snapshots for Studio users', async ({ page }) => {
	await openMap(page);
	await becomeStudio(page);

	await page.getByRole('button', { name: 'Actions for Your First Map', exact: true }).click();
	await page.getByRole('button', { name: 'Version history…', exact: true }).click();

	const dialog = page.getByRole('dialog', { name: 'Version history' });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByText(/No snapshots yet/)).toBeVisible();
	await expect(
		dialog.getByRole('button', { name: 'Snapshot current state' })
	).toBeVisible();
});

test('share by link creates and displays a public URL for Studio users', async ({ page }) => {
	await openMap(page);
	await becomeStudio(page);

	await page.route('**/functions/v1/share*', async (route) => {
		const body = route.request().postDataJSON() as { action?: string };
		if (body.action === 'get') return route.fulfill({ json: { token: null } });
		if (body.action === 'create') return route.fulfill({ json: { token: 'testtok123' } });
		return route.fulfill({ json: {} });
	});

	await page.evaluate(() => window.__mindmap!.workspace.createBoard('Shared Board'));
	const row = page.locator('.board-row', { hasText: 'Shared Board' });
	await row.waitFor();
	await row.getByRole('button', { name: 'Actions for Shared Board', exact: true }).click();
	await page.getByRole('button', { name: 'Share by link…', exact: true }).click();

	const dialog = page.getByRole('dialog', { name: 'Share board' });
	await dialog.getByRole('button', { name: 'Create share link' }).click();

	await expect(dialog.locator('input.link')).toHaveValue(/\/share\/testtok123$/);
});

test('share by link works for mind maps for Studio users', async ({ page }) => {
	await openMap(page);
	await becomeStudio(page);

	await page.route('**/functions/v1/share*', async (route) => {
		const body = route.request().postDataJSON() as { action?: string };
		if (body.action === 'get') return route.fulfill({ json: { token: null } });
		if (body.action === 'create') return route.fulfill({ json: { token: 'maptok456' } });
		return route.fulfill({ json: {} });
	});

	const row = page.locator('.map-row', { hasText: 'Your First Map' });
	await row.getByRole('button', { name: 'Actions for Your First Map', exact: true }).click();
	await page.getByRole('button', { name: 'Share by link…', exact: true }).click();

	const dialog = page.getByRole('dialog', { name: 'Share map' });
	await dialog.getByRole('button', { name: 'Create share link' }).click();

	await expect(dialog.locator('input.link')).toHaveValue(/\/share\/maptok456$/);
});

test('share by link shows the Studio upsell for free users', async ({ page }) => {
	await openMap(page);
	await becomeFree(page);

	await page.evaluate(() => window.__mindmap!.workspace.createBoard('Upsell Board'));
	const row = page.locator('.board-row', { hasText: 'Upsell Board' });
	await row.waitFor();
	await row.getByRole('button', { name: 'Actions for Upsell Board', exact: true }).click();
	await page.getByRole('button', { name: 'Share by link…', exact: true }).click();

	const dialog = page.getByRole('dialog', { name: 'Share board' });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('button', { name: /Upgrade to Studio/ })).toBeVisible();
});

test('the second-device nudge appears and dismisses', async ({ page }) => {
	await openMap(page);

	const sidebar = page.getByRole('complementary', { name: 'Maps sidebar' });
	await expect(sidebar).toBeVisible();

	await page.evaluate(() => {
		window.__mindmap!.sync.nudge = true;
	});
	await expect(sidebar.getByText(/Your maps are on your other device/)).toBeVisible();

	await sidebar.getByRole('button', { name: 'Dismiss' }).click();
	await expect(sidebar.getByText(/Your maps are on your other device/)).not.toBeVisible();
});
