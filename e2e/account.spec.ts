import { expect, test, type Page } from '@playwright/test';
import { nodeByText, openSettings } from './helpers';

async function openMap(page: Page) {
	await page.goto('/workspace');
	await expect(nodeByText(page, 'Central idea')).toBeVisible({ timeout: 15_000 });
}

async function signInAs(page: Page, plan: 'free' | 'pro' | 'studio') {
	await page.evaluate((chosen) => {
		const m = window.__mindmap!;
		m.auth.user = {
			id: 'test-user-id',
			email: 'user@example.com',
			firstName: 'Ada',
			lastName: 'Lovelace',
			country: 'GB'
		};
		m.auth.profile = {
			user_id: 'test-user-id',
			email: 'user@example.com',
			plan: chosen,
			agentaos_subscription_id: null,
			current_period_end: null,
			cancel_at_period_end: false,
			updated_at: new Date().toISOString()
		};
	}, plan);
}

async function openAccount(page: Page, tab: Parameters<typeof openSettings>[1] = 'Plan & Billing') {
	return openSettings(page, tab);
}

test('account window shows the current tier and a Pro → Studio upgrade', async ({ page }) => {
	await openMap(page);
	await signInAs(page, 'pro');
	const dialog = await openAccount(page);

	await expect(dialog.locator('.plan-badge')).toHaveText('Pro');
	await expect(dialog.getByRole('button', { name: /Upgrade to Studio/ })).toBeVisible();
});

test('change password sends a reset link from the account window', async ({ page }) => {
	await openMap(page);
	await signInAs(page, 'pro');

	await page.route('**/auth/v1/recover*', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
	);

	const dialog = await openAccount(page, 'Security');
	await dialog.getByRole('button', { name: 'Change password' }).click();
	await expect(dialog.getByText('Check your inbox for a reset link.')).toBeVisible();
});

test('deleting the account clears local data', async ({ page }) => {
	await openMap(page);

	let deleteCalled = false;
	await page.route('**/functions/v1/delete-account*', (route) => {
		deleteCalled = true;
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ ok: true })
		});
	});

	await signInAs(page, 'free');
	await page.evaluate(() => {
		localStorage.setItem('mindmap:device-id', 'test-device');
		localStorage.setItem('mindmap:sync-tombstones:test-user-id', '{"maps":{},"boards":{}}');
	});

	const dialog = await openAccount(page, 'Security');
	await dialog.getByRole('button', { name: 'Delete account' }).click();
	await dialog.locator('input.confirm-input').fill('user@example.com');

	// The app reloads after clearing; wait for the main-frame reload to finish
	// before touching localStorage (the page can be mid-navigation otherwise).
	const reloaded = page.waitForEvent('framenavigated', (frame) => frame === page.mainFrame());
	await dialog.getByRole('button', { name: 'Permanently delete account' }).click();
	await reloaded;

	expect(deleteCalled).toBe(true);
	expect(await page.evaluate(() => localStorage.getItem('mindmap:device-id'))).toBeNull();
	expect(
		await page.evaluate(() => localStorage.getItem('mindmap:sync-tombstones:test-user-id'))
	).toBeNull();
});

test('sidebar shows the account name and local status when signed out', async ({ page }) => {
	await openMap(page);

	const sidebar = page.getByRole('complementary', { name: 'Maps sidebar' });
	await expect(sidebar.getByTestId('sidebar-account')).toContainText('Account & Settings');
	await expect(sidebar.getByText('Local Only · Register to Sync')).toBeVisible();
});

test('sidebar shows the signed-in name and registered status', async ({ page }) => {
	await openMap(page);
	await signInAs(page, 'free');

	const sidebar = page.getByRole('complementary', { name: 'Maps sidebar' });
	await expect(sidebar.getByTestId('sidebar-account')).toContainText('Ada Lovelace');
	await expect(sidebar.getByText('Registered · Upgrade to Sync')).toBeVisible();
});

test('registration form collects first name, last name and country', async ({ page }) => {
	await openMap(page);

	const window = await openSettings(page, 'Account');
	await window.getByRole('button', { name: 'Sign in / Create account' }).click();

	const auth = page.getByRole('dialog', { name: 'Account' });
	await expect(auth).toBeVisible();
	await auth.getByRole('button', { name: "Don't have an account? Create one" }).click();

	await expect(auth.getByPlaceholder('Ada')).toBeVisible();
	await expect(auth.getByPlaceholder('Lovelace')).toBeVisible();
	await expect(auth.locator('select')).toBeVisible();

	const create = auth.getByRole('button', { name: 'Create account' });
	await expect(create).toBeDisabled();

	await auth.getByPlaceholder('Ada').fill('Ada');
	await auth.getByPlaceholder('Lovelace').fill('Lovelace');
	await auth.getByPlaceholder('you@example.com').fill('ada@example.com');
	await auth.locator('select').selectOption('GB');
	await auth.getByPlaceholder('At least 8 characters').fill('password123');

	await expect(create).toBeEnabled();
});

test('settings window keeps a fixed height across sections', async ({ page }) => {
	await openMap(page);
	await signInAs(page, 'free');

	const dialog = await openSettings(page, 'Profile');
	const profile = (await dialog.boundingBox())!;

	await dialog.getByRole('tab', { name: 'Preferences' }).click();
	const preferences = (await dialog.boundingBox())!;

	await dialog.getByRole('tab', { name: 'Plan & Billing' }).click();
	const plan = (await dialog.boundingBox())!;

	expect(Math.abs(profile.height - preferences.height)).toBeLessThan(1);
	expect(Math.abs(preferences.height - plan.height)).toBeLessThan(1);
});
