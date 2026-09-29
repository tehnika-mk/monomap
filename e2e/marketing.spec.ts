import { expect, test } from '@playwright/test';

test('benefits page renders with canonical and FAQ', async ({ page }) => {
	await page.goto('/benefits');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('The benefits of MonoMap');
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		'https://monomap.app/benefits'
	);
	await expect(page.getByRole('heading', { name: 'You think at the speed of thought' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Frequently asked' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'MonoMap vs Miro' }).first()).toBeVisible();
});

test('MonoMap vs Miro page renders the comparison table', async ({ page }) => {
	await page.goto('/monomap-vs-miro');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('MonoMap vs Miro');
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		'https://monomap.app/monomap-vs-miro'
	);

	const table = page.getByRole('table', { name: 'Feature comparison of MonoMap and Miro' });
	await expect(table).toBeVisible();
	await expect(table.getByRole('columnheader', { name: 'MonoMap' })).toBeVisible();
	await expect(table.getByRole('columnheader', { name: 'Miro' })).toBeVisible();
	await expect(table.getByRole('rowheader', { name: 'Free-plan limits' })).toBeVisible();

	await expect(page.getByText('When Miro is the better choice')).toBeVisible();
	await expect(page.getByText(/Last updated September 2026/)).toBeVisible();
});

test('MonoMap vs XMind page renders the comparison table', async ({ page }) => {
	await page.goto('/monomap-vs-xmind');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('MonoMap vs XMind');
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		'https://monomap.app/monomap-vs-xmind'
	);

	const table = page.getByRole('table', { name: 'Feature comparison of MonoMap and XMind' });
	await expect(table).toBeVisible();
	await expect(table.getByRole('columnheader', { name: 'XMind' })).toBeVisible();
	await expect(table.getByRole('rowheader', { name: 'Gantt & task management' })).toBeVisible();

	await expect(page.getByText('When XMind is the better choice')).toBeVisible();
});

test('footer links to the new compare pages', async ({ page }) => {
	await page.goto('/');

	const compare = page.getByRole('navigation', { name: 'Compare' });
	await expect(compare.getByRole('link', { name: 'Benefits of MonoMap' })).toHaveAttribute(
		'href',
		'/benefits'
	);
	await expect(compare.getByRole('link', { name: 'MonoMap vs Miro' })).toHaveAttribute(
		'href',
		'/monomap-vs-miro'
	);
	await expect(compare.getByRole('link', { name: 'MonoMap vs XMind' })).toHaveAttribute(
		'href',
		'/monomap-vs-xmind'
	);
});
