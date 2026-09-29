import { expect, test } from '@playwright/test';

const BOARD = {
	kind: 'board',
	title: 'Launch Plan',
	data: {
		id: 'board_1',
		title: 'Launch Plan',
		sourceMapId: null,
		createdAt: 1,
		updatedAt: 2,
		columns: [
			{
				id: 'col_1',
				title: 'To do',
				cards: [
					{
						id: 'card_1',
						title: 'Write spec',
						description: 'Cover both flows.',
						labels: [{ text: 'docs', color: '#3b82f6' }],
						dueDate: Date.now() + 86_400_000 * 10,
						checklist: [
							{ id: 'c1', text: 'Draft', done: true },
							{ id: 'c2', text: 'Review', done: false }
						]
					}
				]
			},
			{ id: 'col_2', title: 'Done', cards: [] }
		]
	},
	updatedAt: 2
};

const MAP = {
	kind: 'map',
	title: 'Ideas',
	data: {
		id: 'map_1',
		folderId: null,
		title: 'Ideas',
		createdAt: 1,
		updatedAt: 2,
		rootNode: {
			id: 'n1',
			text: 'Central idea',
			position: { x: 0, y: 0 },
			children: [
				{ id: 'n2', text: 'First branch', position: { x: 240, y: -28 }, children: [] },
				{ id: 'n3', text: 'Second branch', position: { x: 240, y: 28 }, children: [] }
			]
		}
	},
	updatedAt: 2
};

test('renders a shared board read-only', async ({ page }) => {
	await page.route('**/functions/v1/share*', (route) => {
		const body = route.request().postDataJSON() as { action?: string };
		if (body.action === 'resolve') return route.fulfill({ json: BOARD });
		return route.fulfill({ json: {} });
	});

	await page.goto('/share/tok123');

	await expect(page.getByRole('heading', { name: 'Launch Plan' })).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText('Shared board · read-only')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText('Write spec')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText('docs')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText('✓ 1/2')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText('No cards')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByRole('link', { name: /Made with MonoMap/ })).toBeVisible({ timeout: 15_000 });
});

test('renders a shared mind map read-only', async ({ page }) => {
	await page.route('**/functions/v1/share*', (route) => {
		const body = route.request().postDataJSON() as { action?: string };
		if (body.action === 'resolve') return route.fulfill({ json: MAP });
		return route.fulfill({ json: {} });
	});

	await page.goto('/share/maptok');

	await expect(page.getByRole('heading', { name: 'Ideas' })).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText('Shared map · read-only')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByRole('img', { name: /Mind map: Ideas/ })).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText('Central idea')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText('First branch')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText('Second branch')).toBeVisible({ timeout: 15_000 });
});

test('shows a friendly message for invalid links', async ({ page }) => {
	await page.route('**/functions/v1/share*', (route) =>
		route.fulfill({ status: 404, json: { error: 'Not found' } })
	);

	await page.goto('/share/gone');

	await expect(page.getByText(/share link is not valid anymore/i)).toBeVisible({ timeout: 15_000 });
});
