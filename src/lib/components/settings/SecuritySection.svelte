<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { account } from '$lib/stores/account.svelte';

	let sendingReset = $state(false);
	let resetSent = $state(false);

	async function changePassword() {
		if (!auth.user || sendingReset) return;
		sendingReset = true;
		resetSent = false;
		resetSent = await auth.resetPassword(auth.user.email);
		sendingReset = false;
	}

	let confirmingDelete = $state(false);
	let deleteDraft = $state('');
	let deleting = $state(false);

	const deleteReady = $derived(
		(auth.user?.email ?? '') !== '' &&
			deleteDraft.trim().toLowerCase() === (auth.user?.email ?? '').toLowerCase()
	);

	function startDelete() {
		confirmingDelete = true;
		deleteDraft = '';
		auth.error = '';
	}

	function cancelDelete() {
		confirmingDelete = false;
		deleteDraft = '';
		auth.error = '';
	}

	async function confirmDelete() {
		if (!deleteReady || deleting) return;
		deleting = true;
		const ok = await auth.deleteAccount();
		if (ok) {
			window.location.reload();
			return;
		}
		deleting = false;
	}

	async function signOut() {
		account.hide();
		await auth.signOut();
	}
</script>

{#if auth.user}
	<section class="section">
		<h3 class="section-title">Security</h3>

		{#if auth.error}
			<p class="note error" role="alert">{auth.error}</p>
		{/if}

		<div class="row">
			<button
				type="button"
				class="btn"
				disabled={sendingReset}
				onclick={() => void changePassword()}
			>
				{sendingReset ? 'Sending…' : 'Change password'}
			</button>
		</div>
		{#if resetSent}
			<p class="note ok">Check your inbox for a reset link.</p>
		{/if}

		<div class="divider"></div>

		<span class="danger-label">Danger zone</span>
		{#if confirmingDelete}
			<p class="note">
				This permanently deletes your account and every map and board. Type
				<strong>{auth.user.email}</strong> to confirm.
			</p>
			<input
				class="confirm-input"
				bind:value={deleteDraft}
				placeholder={auth.user.email}
				spellcheck="false"
				autocomplete="off"
			/>
			<div class="row">
				<button
					type="button"
					class="btn danger-solid"
					disabled={!deleteReady || deleting}
					onclick={() => void confirmDelete()}
				>
					{deleting ? 'Deleting…' : 'Permanently delete account'}
				</button>
				<button type="button" class="btn" disabled={deleting} onclick={cancelDelete}>Cancel</button>
			</div>
		{:else}
			<div class="row">
				<button type="button" class="btn danger" onclick={startDelete}>Delete account</button>
			</div>
		{/if}

		<div class="divider"></div>

		<div class="row">
			<button type="button" class="btn" onclick={() => void signOut()}>Sign out</button>
		</div>
	</section>
{/if}

<style>
	.section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.section-title {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: calc(15px + var(--font-bump));
		font-weight: 600;
		margin: 0 0 2px;
	}

	.row {
		display: flex;
		gap: 8px;
	}

	.btn {
		flex: 1;
		padding: 10px;
		border: 1px solid var(--edge);
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--fg);
		font-size: calc(12.5px + var(--font-bump));
		font-weight: 500;
		cursor: pointer;
	}

	.btn:hover {
		background: var(--surface-2);
	}

	.btn.danger {
		color: var(--danger);
	}

	.btn.danger:hover {
		background: color-mix(in srgb, var(--danger) 10%, var(--surface-2));
	}

	.btn.danger-solid {
		border-color: transparent;
		background: var(--danger);
		color: var(--danger-fg);
		font-weight: 600;
	}

	.btn.danger-solid:hover {
		filter: brightness(1.05);
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.divider {
		height: 1px;
		background: var(--edge);
		margin: 2px 0;
	}

	.danger-label {
		font-size: calc(11px + var(--font-bump));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--danger);
	}

	.note {
		font-size: calc(12.5px + var(--font-bump));
		color: var(--muted);
		line-height: 1.55;
		margin: 0;
	}

	.note.error {
		color: var(--danger);
	}

	.note.ok {
		color: var(--success);
	}

	.confirm-input {
		width: 100%;
		padding: 9px 12px;
		border: 1px solid var(--edge);
		border-radius: var(--r-sm);
		background: var(--surface-2);
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		outline: none;
	}

	.confirm-input:focus {
		border-color: var(--accent);
	}
</style>
