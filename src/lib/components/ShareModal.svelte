<script lang="ts">
	import { supabase, isStudio } from '$lib/supabase';
	import { auth } from '$lib/stores/auth.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { confirmDialog } from '$lib/stores/confirm.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	let {
		kind,
		id,
		onclose
	}: { kind: 'board' | 'map'; id: string; onclose: () => void } = $props();

	const noun = $derived(kind === 'board' ? 'board' : 'map');
	const entity = $derived(
		kind === 'board'
			? (workspace.boards.find((b) => b.id === id) ?? null)
			: (workspace.maps.find((m) => m.id === id) ?? null)
	);
	const studio = $derived(auth.user !== null && isStudio(auth.profile));

	let token = $state<string | null>(null);
	let loading = $state(true);
	let error = $state('');
	let copied = $state(false);

	const shareUrl = $derived(token ? `${window.location.origin}/share/${token}` : null);

	async function call(action: string): Promise<Record<string, unknown> | null> {
		error = '';
		try {
			const { data, error: fnError } = await supabase.functions.invoke('share', {
				body: { action, kind, id }
			});
			if (fnError) {
				// FunctionsFetchError only says "Failed to send a request…"; append
				// the HTTP status/body when present so the cause is visible.
				let detail = fnError.message;
				const ctx = (fnError as { context?: Response }).context;
				if (ctx && typeof ctx.text === 'function') {
					try {
						const body = await ctx.text();
						if (body) detail += ` — ${body}`;
					} catch {
						/* body already consumed or unreadable */
					}
				}
				throw new Error(detail);
			}
			return (data as Record<string, unknown>) ?? {};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
			return null;
		}
	}

	async function upgradeInStudio() {
		auth.pendingUpgradeTier = 'studio';
		auth.pendingUpgrade = true;
		onclose();
		if (!auth.signedIn) window.dispatchEvent(new CustomEvent('mindmap:open-auth'));
	}

	async function copy() {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			error = 'Could not copy — select the link manually.';
		}
	}

	$effect(() => {
		if (!studio) return;
		void (async () => {
			loading = true;
			const data = await call('get');
			token = (data?.token as string | null) ?? null;
			loading = false;
		})();
	});
</script>

<div class="backdrop" onclick={onclose} aria-hidden="true"></div>
<div class="modal" role="dialog" aria-modal="true" aria-label="Share {noun}">
	<button type="button" class="close" aria-label="Close" onclick={onclose}><Icon name="x" size={14} /></button>
	<h2 class="title">Share {noun}</h2>
	{#if entity}
		<p class="sub">{entity.title}</p>
	{/if}

	{#if !studio}
		<p class="note">
			Sharing lets anyone with your link view a read-only snapshot of this {noun} in their
			browser. It is part of <strong>MonoMap Studio</strong>.
		</p>
		<button type="button" class="action primary" onclick={upgradeInStudio}>
			Upgrade to Studio · €7.99/month
		</button>
	{:else if loading}
		<p class="note">Loading…</p>
	{:else}
		{#if shareUrl}
			<p class="note">
				Anyone with this link can view a read-only copy of the {noun}. The link shows the
				{noun} as it is now; reopen it later to see updates.
			</p>
			<div class="link-row">
				<input class="link" readonly value={shareUrl} onclick={(e) => (e.currentTarget as HTMLInputElement).select()} />
				<button type="button" class="mini primary" onclick={() => void copy()}>
					{copied ? 'Copied' : 'Copy'}
				</button>
			</div>
			<a class="action open" href={shareUrl} target="_blank" rel="noopener noreferrer">
				Open preview ↗
			</a>
			<button
				type="button"
				class="action danger"
				onclick={async () => {
					const ok = await confirmDialog.ask({
						title: `Stop sharing this ${noun}?`,
						message: 'The link will stop working.',
						confirmLabel: 'Revoke link',
						danger: true
					});
					if (!ok) return;
					await call('revoke');
					token = null;
				}}
			>
				Revoke link
			</button>
		{:else}
			<p class="note">
				Create a read-only link for this {noun}. Anyone who has it can follow along in their
				browser — no account needed.
			</p>
			<button
				type="button"
				class="action primary"
				onclick={async () => {
					const data = await call('create');
					token = (data?.token as string | null) ?? null;
				}}
			>
				Create share link
			</button>
		{/if}
	{/if}

	{#if error}<p class="note error" role="alert">{error}</p>{/if}
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
		width: min(420px, calc(100vw - 32px));
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: var(--r-lg);
		box-shadow: 0 24px 64px rgb(0 0 0 / 0.25);
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 12px;
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
		margin: 0;
	}

	.sub {
		font-size: calc(13px + var(--font-bump));
		color: var(--muted);
		margin: -6px 0 0;
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

	.link-row {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.link {
		flex: 1;
		min-width: 0;
		padding: 8px 10px;
		border: 1px solid var(--edge);
		border-radius: var(--r-sm);
		background: var(--surface-2);
		color: var(--fg);
		font-size: calc(12px + var(--font-bump));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.action {
		width: 100%;
		padding: 9px 10px;
		border: 1px solid var(--edge);
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--fg);
		font-size: calc(12.5px + var(--font-bump));
		font-weight: 500;
		text-align: center;
		cursor: pointer;
		text-decoration: none;
		display: inline-block;
		box-sizing: border-box;
	}

	.action.primary {
		border-color: transparent;
		background: var(--accent);
		color: var(--accent-fg);
		font-weight: 600;
	}

	.action.danger {
		color: #dc2626;
	}

	.mini.primary {
		flex: none;
		border: none;
		background: var(--accent);
		color: var(--accent-fg);
		border-radius: var(--r-sm);
		font-size: calc(12px + var(--font-bump));
		font-weight: 600;
		padding: 9px 14px;
		cursor: pointer;
	}
</style>
