<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { versions } from '$lib/stores/versions.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import type { KanbanBoard, MapData } from '$lib/types';
	import Icon from '$lib/components/ui/Icon.svelte';

	let {
		kind,
		id,
		onclose
	}: { kind: 'map' | 'board'; id: string; onclose: () => void } = $props();

	const isBoard = $derived(kind === 'board');
	const entity = $derived(
		isBoard
			? workspace.boards.find((b) => b.id === id) ?? null
			: workspace.maps.find((m) => m.id === id) ?? null
	);

	interface DisplayVersion {
		id: string;
		created_at: number;
		count: number;
		unit: string;
	}

	const list = $derived<DisplayVersion[]>(
		isBoard
			? (versions.boardList[id] ?? []).map((v) => ({
					id: v.id,
					created_at: v.created_at,
					count: v.card_count,
					unit: 'cards'
				}))
			: (versions.list[id] ?? []).map((v) => ({
					id: v.id,
					created_at: v.created_at,
					count: v.node_count,
					unit: 'nodes'
				}))
	);

	let confirmingId = $state<string | null>(null);
	let notice = $state('');

	onMount(() => {
		if (!versions.studio) return;
		if (isBoard) void versions.loadBoardList(id);
		else void versions.loadList(id);
	});

	function formatWhen(ts: number): string {
		const diff = Date.now() - ts;
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins} min ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours} h ago`;
		const days = Math.floor(hours / 24);
		return `${days} d ago`;
	}

	function upgradeInStudio() {
		auth.pendingUpgradeTier = 'studio';
		auth.pendingUpgrade = true;
		onclose();
		if (!auth.signedIn) window.dispatchEvent(new CustomEvent('mindmap:open-auth'));
	}

	async function restore(versionId: string) {
		if (!confirmingId) {
			confirmingId = versionId;
			return;
		}
		confirmingId = null;
		const ok = isBoard
			? await versions.restoreBoard(id, versionId)
			: await versions.restore(id, versionId);
		notice = ok ? 'Version restored.' : versions.error || 'Could not restore.';
		if (ok) setTimeout(onclose, 600);
	}

	async function snapshotCurrent() {
		if (!entity) return;
		if (isBoard) await versions.snapshotBoardNow(entity as KanbanBoard);
		else await versions.snapshotNow(entity as MapData);
	}
</script>

<div class="backdrop" onclick={onclose} aria-hidden="true"></div>
<div class="modal" role="dialog" aria-modal="true" aria-label="Version history">
	<button type="button" class="close" aria-label="Close" onclick={onclose}><Icon name="x" size={14} /></button>
	<h2 class="title">Version history</h2>
	{#if entity}
		<p class="sub">{entity.title}</p>
	{/if}

	{#if !versions.studio}
		<p class="note">
			Version history keeps automatic snapshots of your maps so you can roll back any time.
			It is part of <strong>MonoMap Studio</strong>.
		</p>
		<ul class="perks">
			<li>A snapshot every 10 minutes while you work</li>
			<li>The last 25 versions of each map or board</li>
			<li>One-click rollback, always reversible</li>
		</ul>
		<button type="button" class="action primary" onclick={upgradeInStudio}>
			Upgrade to Studio · €7.99/month
		</button>
	{:else}
		{#if notice}<p class="note ok">{notice}</p>{/if}
		{#if versions.error}<p class="note error">{versions.error}</p>{/if}

		{#if versions.loading}
			<p class="note">Loading…</p>
		{:else if list.length === 0}
			<p class="note">
				No snapshots yet. Versions are captured about every 10 minutes while sync is running.
			</p>
			{#if entity}
				<button type="button" class="action" onclick={() => void snapshotCurrent()}>
					Snapshot current state
				</button>
			{/if}
		{:else}
			<ul class="versions">
				{#each list as v (v.id)}
					<li class="version-row">
						<span class="when">{formatWhen(v.created_at)}</span>
						<span class="nodes">{v.count} {v.unit}</span>
						{#if confirmingId === v.id}
							<span class="confirm">
								Restore this version?
								<button type="button" class="mini danger" onclick={() => void restore(v.id)}>
									Yes
								</button>
								<button type="button" class="mini" onclick={() => (confirmingId = null)}>
									No
								</button>
							</span>
						{:else}
							<button type="button" class="mini" onclick={() => void restore(v.id)}>
								Restore
							</button>
						{/if}
					</li>
				{/each}
			</ul>
			<p class="note hint">Restoring snapshots the current state first, so it can be undone.</p>
		{/if}
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
		width: min(420px, calc(100vw - 32px));
		max-height: min(70vh, 560px);
		overflow-y: auto;
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

	.note.ok {
		color: var(--success);
	}

	.note.error {
		color: var(--danger);
	}

	.note.hint {
		font-size: calc(11.5px + var(--font-bump));
	}

	.perks {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: calc(12.5px + var(--font-bump));
	}

	.perks li::before {
		content: '✓';
		color: var(--accent);
		margin-right: 8px;
	}

	.versions {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.version-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 8px;
		border-radius: var(--r-sm);
		font-size: calc(12.5px + var(--font-bump));
	}

	.version-row:hover {
		background: var(--surface-2);
	}

	.when {
		flex: 1;
	}

	.nodes {
		color: var(--muted);
		font-size: calc(11.5px + var(--font-bump));
	}

	.confirm {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: calc(11.5px + var(--font-bump));
		color: var(--muted);
	}

	.mini {
		border: 1px solid var(--edge);
		background: transparent;
		color: var(--fg);
		border-radius: var(--r-sm);
		font-size: calc(11.5px + var(--font-bump));
		padding: 3px 10px;
		cursor: pointer;
	}

	.mini:hover {
		background: var(--surface-2);
	}

	.mini.danger {
		color: var(--danger);
		border-color: color-mix(in srgb, var(--danger) 40%, var(--edge));
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
	}

	.action.primary {
		border-color: transparent;
		background: var(--accent);
		color: var(--accent-fg);
		font-weight: 600;
	}
</style>
