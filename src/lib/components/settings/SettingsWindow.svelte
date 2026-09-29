<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { account, type SettingsTab } from '$lib/stores/account.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { isStudio } from '$lib/supabase';
	import ProfileSection from './ProfileSection.svelte';
	import PreferencesSection from './PreferencesSection.svelte';
	import PlanSection from './PlanSection.svelte';
	import SecuritySection from './SecuritySection.svelte';
	import HelpModal from '../HelpModal.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	let showHelp = $state(false);

	interface Tab {
		id: SettingsTab;
		label: string;
	}

	const tabs = $derived<Tab[]>(
		auth.user
			? [
					{ id: 'profile', label: 'Profile' },
					{ id: 'preferences', label: 'Preferences' },
					{ id: 'plan', label: 'Plan & Billing' },
					{ id: 'security', label: 'Security' }
				]
			: [
					{ id: 'preferences', label: 'Preferences' },
					{ id: 'account', label: 'Account' }
				]
	);

	const active = $derived<Tab>(
		tabs.find((t) => t.id === account.tab) ?? tabs[0]
	);

	const planLabel = $derived(auth.pro ? (isStudio(auth.profile) ? 'Studio' : 'Pro') : 'Free');

	function close() {
		account.hide();
	}

	function openAuth() {
		account.hide();
		window.dispatchEvent(new CustomEvent('mindmap:open-auth'));
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && account.open) close();
	}}
/>

{#if account.open}
	<div class="backdrop" onclick={close} aria-hidden="true"></div>
	<div class="window" role="dialog" aria-modal="true" aria-label="Account and settings">
		<div class="sheet-handle" aria-hidden="true"></div>
		<header class="win-head">
			{#if auth.user}
				<span class="avatar" aria-hidden="true">{auth.initials}</span>
				<div class="who">
					<span class="who-name" title={auth.displayName}>{auth.displayName}</span>
					<span class="who-email" title={auth.user.email}>{auth.user.email}</span>
				</div>
				<span class="plan-badge" class:pro={auth.pro}>{planLabel}</span>
			{:else}
				<span class="avatar muted" aria-hidden="true"><Icon name="user" size={18} /></span>
				<div class="who">
					<span class="who-name">Account &amp; Settings</span>
					<span class="who-email">Local only — your data stays on this device</span>
				</div>
			{/if}
			<button type="button" class="close" aria-label="Close" onclick={close}><Icon name="x" size={18} /></button>
		</header>

		<div class="win-body">
			<div
				class="rail"
				role="tablist"
				aria-label="Settings sections"
				aria-orientation={ui.isCompact ? 'horizontal' : 'vertical'}
			>
				{#each tabs as t (t.id)}
					<button
						type="button"
						role="tab"
						aria-selected={active.id === t.id}
						class:on={active.id === t.id}
						onclick={() => (account.tab = t.id)}
					>
						{t.label}
					</button>
				{/each}
			</div>

			<div class="pane" role="tabpanel" aria-label={active.label}>
				{#if active.id === 'profile'}
					<ProfileSection />
				{:else if active.id === 'preferences'}
					<PreferencesSection onOpenHelp={() => (showHelp = true)} />
				{:else if active.id === 'plan'}
					<PlanSection />
				{:else if active.id === 'security'}
					<SecuritySection />
				{:else}
					<div class="signed-out">
						<h3 class="section-title">Account</h3>
						<p class="lead">Sign in or create an account to sync your maps across devices.</p>
						<button type="button" class="btn primary" onclick={openAuth}>
							Sign in / Create account
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
	{#if showHelp}
		<HelpModal onclose={() => (showHelp = false)} />
	{/if}
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		background: rgb(0 0 0 / 0.35);
	}

	.window {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: var(--z-modal);
		width: min(720px, calc(100vw - 48px));
		height: min(640px, calc(100dvh - 64px));
		max-height: calc(100dvh - 64px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: var(--r-lg);
		box-shadow: 0 24px 64px rgb(0 0 0 / 0.28);
	}

	.sheet-handle {
		display: none;
	}

	.win-head {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 18px;
		border-bottom: 1px solid var(--edge);
		flex: none;
	}

	.avatar {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--accent) 14%, var(--surface-2));
		color: var(--accent);
		font-size: calc(14px + var(--font-bump));
		font-weight: 600;
	}

	.avatar.muted {
		background: var(--surface-2);
		color: var(--muted);
		font-size: calc(16px + var(--font-bump));
	}

	.who {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.who-name {
		font-size: calc(14px + var(--font-bump));
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.who-email {
		font-size: calc(12px + var(--font-bump));
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.plan-badge {
		flex: none;
		font-size: calc(10.5px + var(--font-bump));
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
		background: var(--surface-2);
		border-radius: var(--r-xs);
		padding: 3px 9px;
	}

	.plan-badge.pro {
		color: var(--accent-fg);
		background: var(--accent);
	}

	.close {
		flex: none;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(20px + var(--font-bump));
		line-height: 1;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: var(--r-sm);
	}

	.close:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.win-body {
		display: flex;
		min-height: 0;
		flex: 1;
	}

	.rail {
		flex: none;
		width: 190px;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		border-right: 1px solid var(--edge);
		background: color-mix(in srgb, var(--surface-2) 55%, var(--surface));
	}

	.rail button {
		text-align: left;
		padding: 9px 12px;
		border: none;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--muted);
		font-size: calc(13px + var(--font-bump));
		cursor: pointer;
	}

	.rail button:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.rail button.on {
		color: var(--fg);
		background: var(--surface);
		font-weight: 600;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
	}

	.pane {
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		padding: 20px;
	}

	.signed-out {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.section-title {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: calc(15px + var(--font-bump));
		font-weight: 600;
		margin: 0;
	}

	.lead {
		font-size: calc(13px + var(--font-bump));
		color: var(--muted);
		line-height: 1.55;
		margin: 0;
	}

	.btn {
		padding: 10px 18px;
		border: 1px solid var(--edge);
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--fg);
		font-size: calc(12.5px + var(--font-bump));
		font-weight: 600;
		cursor: pointer;
	}

	.btn.primary {
		border-color: transparent;
		background: var(--accent);
		color: var(--accent-fg);
	}

	.btn.primary:hover {
		filter: brightness(1.05);
	}

	@media (max-width: 640px) {
		.window {
			top: auto;
			left: 0;
			right: 0;
			bottom: 0;
			transform: none;
			width: 100%;
			height: min(88dvh, calc(100dvh - 16px));
			max-height: calc(100dvh - 16px);
			border-radius: var(--r-lg) var(--r-lg) 0 0;
			padding-bottom: env(safe-area-inset-bottom);
		}

		.sheet-handle {
			display: block;
			width: 44px;
			height: 4px;
			border-radius: 9999px;
			background: var(--edge);
			margin: 10px auto 0;
			flex: none;
		}

		.win-body {
			flex-direction: column;
		}

		.rail {
			flex-direction: row;
			width: auto;
			overflow-x: auto;
			padding: 8px;
			border-right: none;
			border-bottom: 1px solid var(--edge);
			scrollbar-width: none;
		}

		.rail::-webkit-scrollbar {
			display: none;
		}

		.rail button {
			white-space: nowrap;
			padding: 8px 12px;
		}
	}
</style>
