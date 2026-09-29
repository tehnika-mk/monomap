<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { countries, guessCountry, type Country } from '$lib/data/countries';
	import Icon from '$lib/components/ui/Icon.svelte';

	let mode = $state<'signin' | 'signup' | 'reset'>('signin');
	let email = $state('');
	let password = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let country = $state(guessCountry());
	let sent = $state(false);

	const countryList: Country[] = countries();

	const canSubmit = $derived(
		mode === 'signin'
			? email.trim() !== '' && password !== ''
			: mode === 'signup'
				? email.trim() !== '' &&
					password.length >= 8 &&
					firstName.trim() !== '' &&
					lastName.trim() !== '' &&
					country !== ''
				: email.trim() !== ''
	);

	function toggleMode() {
		mode = mode === 'signin' ? 'signup' : 'signin';
		auth.error = '';
		auth.notice = '';
		sent = false;
	}

	function goReset() {
		mode = 'reset';
		auth.error = '';
		auth.notice = '';
		sent = false;
	}

	async function submit() {
		if (!canSubmit) return;
		if (mode === 'reset') {
			sent = await auth.resetPassword(email);
			return;
		}
		const ok =
			mode === 'signin'
				? await auth.signIn(email, password)
				: await auth.signUp({ email, password, firstName, lastName, country });
		if (ok) {
			auth.error = '';
			close();
		}
	}

	function close() {
		window.dispatchEvent(new CustomEvent('mindmap:close-auth'));
	}
</script>

<div class="backdrop" onclick={close} aria-hidden="true"></div>
<div class="modal" role="dialog" aria-modal="true" aria-label="Account">
	<button type="button" class="close" aria-label="Close" onclick={close}><Icon name="x" size={14} /></button>

	<h2 class="title">
		{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
	</h2>
	<p class="sub">
		{#if mode === 'signin'}
			Sign in to sync your maps across devices.
		{:else if mode === 'signup'}
			Create a free account to start syncing your maps.
		{:else}
			Enter your email and we'll send you a link to set a new password.
		{/if}
	</p>

	<form
		class="form"
		onsubmit={(e) => {
			e.preventDefault();
			void submit();
		}}
	>
		{#if mode === 'signup'}
			<div class="row">
				<label>
					<span class="label">First name</span>
					<input
						bind:value={firstName}
						type="text"
						autocomplete="given-name"
						required
						placeholder="Ada"
					/>
				</label>
				<label>
					<span class="label">Last name</span>
					<input
						bind:value={lastName}
						type="text"
						autocomplete="family-name"
						required
						placeholder="Lovelace"
					/>
				</label>
			</div>
		{/if}

		<label>
			<span class="label">Email</span>
			<input
				bind:value={email}
				type="email"
				autocomplete="email"
				required
				placeholder="you@example.com"
			/>
		</label>

		{#if mode === 'signup'}
			<label>
				<span class="label">Country</span>
				<select bind:value={country} required>
					<option value="" disabled>Select your country&hellip;</option>
					{#each countryList as c (c.code)}
						<option value={c.code}>{c.name}</option>
					{/each}
				</select>
			</label>
		{/if}

		{#if mode !== 'reset'}
			<label>
				<span class="label">Password</span>
				<input
					bind:value={password}
					type="password"
					autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
					required
					minlength={8}
					placeholder="At least 8 characters"
				/>
			</label>
		{/if}

		{#if sent}
			<p class="notice" role="status">Check your inbox for the reset link.</p>
		{/if}

		{#if auth.error}
			<p class="notice error" role="alert">
				{auth.error}
			</p>
		{/if}

		{#if auth.notice}
			<p class="notice" role="status">
				{auth.notice}
			</p>
		{/if}

		<button type="submit" class="primary" disabled={!canSubmit}>
			{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
		</button>
	</form>

	{#if mode === 'signin'}
		<button type="button" class="link" onclick={goReset}>Forgot password?</button>
		<button type="button" class="switch" onclick={toggleMode}>
			Don't have an account? Create one
		</button>
	{:else if mode === 'reset'}
		<button type="button" class="switch" onclick={toggleMode}>Back to sign in</button>
	{:else}
		<button type="button" class="switch" onclick={toggleMode}>
			Already have an account? Sign in
		</button>
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
		width: min(400px, calc(100vw - 32px));
		max-height: calc(100vh - 48px);
		overflow-y: auto;
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

	.row {
		display: flex;
		gap: 10px;
	}

	.form label {
		display: flex;
		flex: 1;
		min-width: 0;
		flex-direction: column;
		gap: 5px;
	}

	.label {
		font-size: calc(11px + var(--font-bump));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}

	.form input,
	.form select {
		width: 100%;
		padding: 9px 12px;
		border-radius: var(--r-sm);
		border: 1px solid var(--edge);
		background: var(--surface-2);
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		outline: none;
	}

	.form input:focus,
	.form select:focus {
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

	.primary:hover:not(:disabled) {
		filter: brightness(1.05);
	}

	.primary:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.switch {
		margin-top: 14px;
		width: 100%;
		border: none;
		background: transparent;
		color: var(--accent);
		font-size: calc(12.5px + var(--font-bump));
		cursor: pointer;
	}

	.link {
		margin-top: 10px;
		width: 100%;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(12px + var(--font-bump));
		cursor: pointer;
		text-align: center;
	}

	.link:hover {
		color: var(--fg);
	}

	.error,
	.notice {
		font-size: calc(12.5px + var(--font-bump));
		margin: 0;
		line-height: 1.5;
	}

	.error {
		color: var(--danger);
	}

	.notice {
		color: var(--muted);
	}

	@media (max-width: 380px) {
		.row {
			flex-direction: column;
			gap: 12px;
		}
	}
</style>
