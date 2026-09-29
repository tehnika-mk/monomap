import type { Locator, Page } from '@playwright/test';

// The canvas node card is a [data-node] div; this locator avoids ambiguity
// with the sidebar map rows and notes drawer header that may render the same text.
export function nodeByText(page: Page, text: string): Locator {
	return page.locator('[data-node]').filter({ hasText: text });
}

export type SettingsTab =
	| 'Profile'
	| 'Preferences'
	| 'Plan & Billing'
	| 'Security'
	| 'Account';

// Opens the unified Account / Settings / Preferences window from the sidebar
// and selects a section. Returns the window locator.
export async function openSettings(page: Page, tab?: SettingsTab): Promise<Locator> {
	await page.locator('[data-testid="sidebar-account"]').click();
	const dialog = page.getByRole('dialog', { name: 'Account and settings' });
	await dialog.waitFor();
	if (tab) await dialog.getByRole('tab', { name: tab }).click();
	return dialog;
}

