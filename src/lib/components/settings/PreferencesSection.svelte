<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { applyProfile, buildProfile, parseProfile } from '$lib/profile';
	import { downloadJson } from '$lib/utils/download';
	import { confirmDialog } from '$lib/stores/confirm.svelte';

	let { onOpenHelp }: { onOpenHelp: () => void } = $props();

	let profileInput = $state<HTMLInputElement | null>(null);
	let importingProfile = $state(false);

	function saveProfile() {
		downloadJson(buildProfile(), 'mindmap-profile.json');
	}

	async function importProfileFile(file: File) {
		const text = await file.text();
		const profile = parseProfile(text);
		if (!profile) {
			alert('This is not a valid Mind Map profile file.');
			return;
		}
		const confirmed = await confirmDialog.ask({
			title: 'Replace local workspace?',
			message: 'This replaces your current local workspace with the imported profile.',
			confirmLabel: 'Replace',
			danger: true
		});
		if (confirmed) applyProfile(profile);
	}

	function onProfileChosen(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			importingProfile = true;
			void importProfileFile(file).finally(() => {
				importingProfile = false;
				input.value = '';
			});
		}
	}
</script>

<section class="section">
	<h3 class="section-title">Preferences</h3>

	<div class="prefs">
		<button
			type="button"
			class="pref-row"
			class:active={theme.theme === 'dark'}
			aria-pressed={theme.theme === 'dark'}
			title="Toggle dark mode"
			onclick={() => theme.toggle()}
		>
			<span class="pref-glyph">
				{#if theme.theme === 'dark'}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<circle cx="12" cy="12" r="4" />
						<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
					</svg>
				{:else}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
					</svg>
				{/if}
			</span>
			<span class="pref-name">{theme.theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
		</button>
		<button
			type="button"
			class="pref-row"
			class:active={settings.gridEnabled}
			aria-pressed={settings.gridEnabled}
			title="Background Dots"
			onclick={() => settings.toggleGrid()}
		>
			<span class="pref-glyph">
				<svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
					<circle cx="2" cy="2" r="1.1" />
					<circle cx="6" cy="2" r="1.1" />
					<circle cx="10" cy="2" r="1.1" />
					<circle cx="2" cy="6" r="1.1" />
					<circle cx="6" cy="6" r="1.1" />
					<circle cx="10" cy="6" r="1.1" />
					<circle cx="2" cy="10" r="1.1" />
					<circle cx="6" cy="10" r="1.1" />
					<circle cx="10" cy="10" r="1.1" />
				</svg>
			</span>
			<span class="pref-name">Background Dots</span>
		</button>
		<button
			type="button"
			class="pref-row"
			class:active={settings.snapEnabled}
			aria-pressed={settings.snapEnabled}
			title="Snap to grid"
			onclick={() => settings.toggleSnap()}
		>
			<span class="pref-glyph">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M4 4h16v16H4z" />
					<path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
				</svg>
			</span>
			<span class="pref-name">Snap to grid</span>
		</button>
		<button type="button" class="pref-row" title="Help & tutorial" onclick={onOpenHelp}>
			<span class="pref-glyph">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="9" />
					<path d="M9.5 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.7-.9 1.4v.6" />
					<path d="M12 17h.01" />
				</svg>
			</span>
			<span class="pref-name">Help &amp; tutorial</span>
		</button>
	</div>

	<div class="profile">
		<span class="profile-label">Profile backup</span>
		<p class="profile-hint">Save your whole workspace and settings, or restore them here.</p>
		<div class="profile-actions">
			<button type="button" onclick={saveProfile}>Save profile</button>
			<button type="button" disabled={importingProfile} onclick={() => profileInput?.click()}>
				{importingProfile ? 'Importing…' : 'Import profile'}
			</button>
		</div>
		<input
			bind:this={profileInput}
			type="file"
			accept=".json,application/json"
			data-testid="import-profile"
			class="hidden"
			onchange={onProfileChosen}
		/>
	</div>
</section>

<style>
	.section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.section-title {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: calc(15px + var(--font-bump));
		font-weight: 600;
		margin: 0 0 8px;
	}

	.prefs {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.pref-row {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 10px 10px;
		border: none;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		text-align: left;
		cursor: pointer;
	}

	.pref-row:hover,
	.pref-row.active {
		background: var(--surface-2);
	}

	.pref-glyph {
		width: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--muted);
		flex: none;
	}

	.pref-name {
		flex: 1;
	}

	.profile {
		margin-top: 18px;
		padding-top: 16px;
		border-top: 1px solid var(--edge);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.profile-label {
		font-size: calc(11px + var(--font-bump));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}

	.profile-hint {
		font-size: calc(12.5px + var(--font-bump));
		color: var(--muted);
		margin: -4px 0 0;
		line-height: 1.55;
	}

	.profile-actions {
		display: flex;
		gap: 8px;
	}

	.profile-actions button {
		flex: 1;
		padding: 9px 8px;
		border: 1px solid var(--edge);
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--fg);
		font-size: calc(12.5px + var(--font-bump));
		cursor: pointer;
	}

	.profile-actions button:hover {
		background: var(--surface-2);
	}

	.profile-actions button:disabled {
		opacity: 0.6;
		cursor: default;
	}
</style>
