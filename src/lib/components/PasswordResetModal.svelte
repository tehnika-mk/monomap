<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	let password = $state('');
	let confirm = $state('');
	let done = $state(false);
	let mismatch = $state(false);

	async function submit() {
		if (password.length < 8) {
			auth.error = 'Password must be at least 8 characters.';
			return;
		}
		if (password !== confirm) {
			mismatch = true;
			return;
		}
		mismatch = false;
		done = await auth.updatePassword(password);
	}

	function close() {
		auth.recovery = false;
	}
</script>

<div class="backdrop" onclick={close} aria-hidden="true"></div>
<div class="modal" role="dialog" aria-modal="true" aria-label="Set a new password">
	<button type="button" class="close" aria-label="Close" onclick={close}><Icon name="x" size={14} /></button>

	<h2 class="title">Set a new password</h2>
	<p class="sub">Choose a new password for {auth.user?.email}.</p>

	{#if done}
		<p class="notice" role="status">
			Your password was updated. You can keep using MonoMap as usual.
		</p>
	{:else}
		<form
			class="form"
			onsubmit={(e) => {
				e.preventDefault();
				void submit();
			}}
		>
			<label>
				<span class="label">New password</span>
				<input
					bind:value={password}
					type="password"
					autocomplete="new-password"
					required
					minlength={8}
					placeholder="At least 8 characters"
				/>
			</label>
			<label>
				<span class="label">Confirm password</span>
				<input
					bind:value={confirm}
					type="password"
					autocomplete="new-password"
					required
					minlength={8}
					placeholder="Repeat the password"
				/>
			</label>

			{#if mismatch}
				<p class="notice error" role="alert">Passwords don't match.</p>
			{/if}
			{#if auth.error}
				<p class="notice error" role="alert">{auth.error}</p>
			{/if}

			<button type="submit" class="primary">Update password</button>
		</form>
	{/if}
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		background: rgb(0 0 0 / 0.35);
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: var(--z-modal);
		width: min(360px, calc(100vw - 32px));
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: var(--r-lg);
		box-shadow: 0 24px 64px rgb(0 0 0 / 0.25);
		padding: 24px;
	}

	.close {
		position: absolute;
		top: 12px;
		right: 12px;
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

	.title {
		font-size: calc(17px + var(--font-bump));
		font-weight: 600;
		margin: 0 0 4px;
	}

	.sub {
		font-size: calc(13px + var(--font-bump));
		color: var(--muted);
		margin: 0 0 18px;
		line-height: 1.5;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.form label {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.label {
		font-size: calc(11px + var(--font-bump));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}

	.form input {
		padding: 9px 12px;
		border-radius: var(--r-sm);
		border: 1px solid var(--edge);
		background: var(--surface-2);
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		outline: none;
	}

	.form input:focus {
		border-color: var(--accent);
	}

	.primary {
		margin-top: 4px;
		padding: 11px;
		border: none;
		border-radius: var(--r-sm);
		background: var(--accent);
		color: var(--accent-fg);
		font-size: calc(13.5px + var(--font-bump));
		font-weight: 600;
		cursor: pointer;
	}

	.primary:hover {
		filter: brightness(1.05);
	}

	.notice {
		font-size: calc(12.5px + var(--font-bump));
		color: var(--muted);
		margin: 0;
		line-height: 1.5;
	}

	.notice.error {
		color: var(--danger);
	}
</style>
