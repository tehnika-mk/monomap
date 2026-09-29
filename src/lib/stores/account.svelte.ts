export type SettingsTab = 'profile' | 'preferences' | 'plan' | 'security' | 'account';

// Transient UI state for the unified Account / Settings / Preferences window.
export class AccountState {
	open = $state(false);
	tab = $state<SettingsTab>('profile');

	show(tab: SettingsTab = 'profile'): void {
		this.tab = tab;
		this.open = true;
	}

	hide(): void {
		this.open = false;
	}
}

export const account = new AccountState();
