<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { countries } from '$lib/data/countries';

	const list = countries();

	let firstName = $state('');
	let lastName = $state('');
	let country = $state('');
	let saving = $state(false);

	$effect(() => {
		firstName = auth.user?.firstName ?? '';
		lastName = auth.user?.lastName ?? '';
		country = auth.user?.country ?? '';
	});

	const valid = $derived(
		firstName.trim() !== '' && lastName.trim() !== '' && country !== ''
	);
	const dirty = $derived(
		!!auth.user &&
			(firstName.trim() !== (auth.user.firstName ?? '') ||
				lastName.trim() !== (auth.user.lastName ?? '') ||
				country !== (auth.user.country ?? ''))
	);

	async function save() {
		if (!dirty || !valid || saving) return;
		saving = true;
		await auth.updateProfile({ firstName, lastName, country });
		saving = false;
	}
</script>

{#if auth.user}
	<section class="section">
		<h3 class="section-title">Profile</h3>
		<p class="hint">Your name is shown in the sidebar. Your email is used to sign in.</p>

		<div class="grid">
			<label>
				<span class="field-label">First name</span>
				<input bind:value={firstName} type="text" autocomplete="given-name" />
			</label>
			<label>
				<span class="field-label">Last name</span>
				<input bind:value={lastName} type="text" autocomplete="family-name" />
			</label>
		</div>

		<label>
			<span class="field-label">Email</span>
			<input value={auth.user.email} type="email" readonly />
		</label>

		<label>
			<span class="field-label">Country</span>
			<select bind:value={country}>
				<option value="" disabled>Select your country&hellip;</option>
				{#each list as c (c.code)}
					<option value={c.code}>{c.name}</option>
				{/each}
			</select>
		</label>

		{#if auth.error}
			<p class="note error" role="alert">{auth.error}</p>
		{/if}

		<div class="actions">
			<button
				type="button"
				class="btn primary"
				disabled={!dirty || !valid || saving}
				onclick={() => void save()}
			>
				{saving ? 'Saving…' : 'Save changes'}
			</button>
		</div>
	</section>
{/if}

<style>
	.section {
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

	.hint {
		font-size: calc(12.5px + var(--font-bump));
		color: var(--muted);
		margin: -6px 0 0;
		line-height: 1.55;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.field-label {
		font-size: calc(11px + var(--font-bump));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}

	input,
	select {
		width: 100%;
		padding: 9px 12px;
		border-radius: var(--r-sm);
		border: 1px solid var(--edge);
		background: var(--surface-2);
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		outline: none;
	}

	input:focus,
	select:focus {
		border-color: var(--accent);
	}

	input[readonly] {
		color: var(--muted);
		cursor: default;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 4px;
	}

	.btn {
		padding: 9px 18px;
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

	.btn.primary:hover:not(:disabled) {
		filter: brightness(1.05);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.note {
		font-size: calc(12.5px + var(--font-bump));
		margin: 0;
		line-height: 1.55;
	}

	.note.error {
		color: var(--danger);
	}

	@media (max-width: 640px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
