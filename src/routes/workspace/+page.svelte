<script lang="ts">
	import { onMount } from 'svelte';
	import Canvas from '$lib/components/Canvas.svelte';
	import Keyboard from '$lib/components/Keyboard.svelte';
	import NodePanel from '$lib/components/NodePanel.svelte';
	import MdPane from '$lib/components/MdPane.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import ShortcutsBar from '$lib/components/ShortcutsBar.svelte';
	import KanbanBoard from '$lib/components/kanban/KanbanBoard.svelte';
	import Toasts from '$lib/components/Toasts.svelte';
	import PasswordResetModal from '$lib/components/PasswordResetModal.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { canvas } from '$lib/stores/canvas.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { sync } from '$lib/stores/sync.svelte';
	import { versions } from '$lib/stores/versions.svelte';
	import { account } from '$lib/stores/account.svelte';
	import { kanban } from '$lib/stores/kanban.svelte';

	let ready = $state(false);

	onMount(() => {
		void workspace.init().then(() => {
			window.__mindmap = { workspace, canvas, auth, sync, versions, account, kanban };
			requestAnimationFrame(() => (ready = true));
		});
		if (new URLSearchParams(window.location.search).has('upgrade')) {
			// Raw history API: SvelteKit's replaceState is not initialized yet this
			// early in a client-only page, and no in-app navigation happens after.
			window.history.replaceState({}, '', '/workspace');
			auth.pendingUpgrade = true;
		}
		void auth.init();
		// Instantiate the sync store so its reactive push/pull effect is active.
		void sync.refresh();
	});
</script>

<svelte:head>
	<title>{workspace.viewMode === 'kanban'
		? workspace.getActiveBoard()?.title ?? 'MonoMap'
		: workspace.getActiveMap()?.title ?? 'MonoMap'}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !ready}
	<main class="flex h-full flex-col items-center justify-center gap-3 select-none">
		<div class="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/30">
			<svg width="34" height="34" viewBox="0 0 32 32" fill="none">
				<circle cx="16" cy="16" r="7" fill="var(--accent)" />
				<circle cx="16" cy="16" r="3.5" fill="var(--canvas)" />
			</svg>
		</div>
		<h1 class="text-lg font-semibold tracking-tight">MonoMap</h1>
		<p class="text-sm text-muted">Loading workspace&hellip;</p>
	</main>
{:else}
	<div class="relative h-dvh w-full overflow-hidden">
		<Keyboard />
		<div class="absolute inset-0" class:hidden={workspace.viewMode === 'kanban'}>
			<Canvas />
			<MdPane />
			<NodePanel />
			<TabBar />
		</div>
		{#if workspace.viewMode === 'kanban'}
			<KanbanBoard />
		{/if}
		<Sidebar />
		<ShortcutsBar />
		<Toasts />
		<ConfirmDialog />
		{#if auth.recovery}
			<PasswordResetModal />
		{/if}
	</div>
{/if}

<style>
	main {
		height: 100dvh;
	}
</style>
