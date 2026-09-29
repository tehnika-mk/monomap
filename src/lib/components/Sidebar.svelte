<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { KanbanBoard, MapData } from '$lib/types';
	import { canvas } from '$lib/stores/canvas.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { workspace } from '$lib/stores/workspace.svelte';
	import { sync } from '$lib/stores/sync.svelte';
	import AuthModal from './AuthModal.svelte';
	import VersionHistoryModal from './VersionHistoryModal.svelte';
	import ShareModal from './ShareModal.svelte';
	import WorkspaceSwitch from './WorkspaceSwitch.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import SettingsWindow from './settings/SettingsWindow.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { account } from '$lib/stores/account.svelte';
	import { isStudio } from '$lib/supabase';
	import { downloadText, safeFilename } from '$lib/utils/download';
	import { exportMapPng } from '$lib/utils/exportPng';
	import { autoSortTree, mapToMarkdown, parseMarkdownTree } from '$lib/utils/treeExport';
	import { clickOutside } from '$lib/actions/clickOutside';

	let showAuth = $state(false);
	let versionFor = $state<{ kind: 'map' | 'board'; id: string } | null>(null);
	let shareFor = $state<{ kind: 'board' | 'map'; id: string } | null>(null);

	// Folder creation is temporarily hidden; existing folders still render.
	const foldersEnabled = false;

	const accountLabel = $derived(auth.signedIn ? auth.displayName : 'Account & Settings');
	const planLabel = $derived(auth.pro ? (isStudio(auth.profile) ? 'Studio' : 'Pro') : 'Free');
	const statusLabel = $derived.by(() => {
		if (!auth.signedIn) return 'Local Only · Register to Sync';
		if (!auth.pro) return 'Registered · Upgrade to Sync';
		if (sync.status === 'syncing') return 'Registered · Syncing…';
		if (sync.status === 'offline') return 'Registered · Sync Offline';
		return 'Registered · Sync Enabled';
	});

	$effect(() => {
		const onCloseAuth = () => (showAuth = false);
		window.addEventListener('mindmap:close-auth', onCloseAuth);
		return () => window.removeEventListener('mindmap:close-auth', onCloseAuth);
	});

	$effect(() => {
		const onOpenAuth = () => (showAuth = true);
		window.addEventListener('mindmap:open-auth', onOpenAuth);
		return () => window.removeEventListener('mindmap:open-auth', onOpenAuth);
	});

	$effect(() => {
		if (!auth.initialized || !auth.pendingUpgrade) return;
		if (auth.signedIn) {
			auth.pendingUpgrade = false;
			account.show('plan');
		} else {
			showAuth = true;
		}
	});

	const maps = $derived(workspace.maps);
	const folders = $derived(workspace.folders);
	const boards = $derived(workspace.boards);
	const activeTabId = $derived(workspace.activeTabId);
	const activeBoardId = $derived(workspace.activeBoardId);
	const open = $derived(canvas.sidebarOpen);
	const unassigned = $derived(maps.filter((m) => !m.folderId));
	const isMindMap = $derived(workspace.viewMode !== 'kanban');

	let expanded = $state<Record<string, boolean>>({});
	let menuFor = $state<string | null>(null);
	let folderMenuFor = $state<string | null>(null);
	let boardMenuFor = $state<string | null>(null);
	let renaming = $state<{ type: 'map' | 'folder' | 'board'; id: string } | null>(null);
	let renameDraft = $state('');
	let addingFolder = $state(false);
	let newFolderDraft = $state('');
	let dragTarget = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	let importing = $state(false);

	function folderExpanded(folderId: string) {
		return expanded[folderId] !== false;
	}

	function folderMaps(folderId: string) {
		return maps.filter((m) => m.folderId === folderId);
	}

	function startRename(type: 'map' | 'folder' | 'board', id: string, current: string) {
		renaming = { type, id };
		renameDraft = current;
		menuFor = null;
		folderMenuFor = null;
		boardMenuFor = null;
	}

	function commitRename() {
		if (!renaming) return;
		const value = renameDraft.trim();
		if (renaming.type === 'map') workspace.renameMap(renaming.id, value || 'Untitled Map');
		else if (renaming.type === 'folder') workspace.renameFolder(renaming.id, value || 'Folder');
		else workspace.renameBoard(renaming.id, value || 'Untitled Board');
		renaming = null;
	}

	function commitNewFolder() {
		const value = newFolderDraft.trim();
		if (value) workspace.createFolder(value);
		addingFolder = false;
		newFolderDraft = '';
	}

	function exportMapMd(map: MapData) {
		downloadText(mapToMarkdown(map), `${safeFilename(map.title)}.md`);
	}

	async function exportMapPngAction(map: MapData) {
		const world = document.querySelector<HTMLElement>('[data-world]');
		if (!world) return;
		await exportMapPng(map.title, world, canvas.nodeSizes, map.rootNode);
	}

	async function importFile(file: File) {
		const text = await file.text();
		const root = parseMarkdownTree(text);
		autoSortTree(root);
		const title = file.name.replace(/\.(md|markdown|txt)$/i, '') || 'Imported';
		workspace.createMapFromRoot(title, root);
	}

	function onFileChosen(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			importing = true;
			void importFile(file).finally(() => {
				importing = false;
				input.value = '';
			});
		}
	}

	function onDragStart(e: DragEvent, mapId: string) {
		e.dataTransfer?.setData('text/map', mapId);
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}

	function onDragOver(e: DragEvent, target: string) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragTarget = target;
	}

	function onDrop(e: DragEvent, target: string) {
		e.preventDefault();
		dragTarget = null;
		const id = e.dataTransfer?.getData('text/map');
		if (id) workspace.moveMap(id, target === 'root' ? null : target);
	}

	function autofocus(el: HTMLInputElement) {
		el.focus();
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			menuFor = null;
			folderMenuFor = null;
			boardMenuFor = null;
			renaming = null;
			addingFolder = false;
		}
	}}
	onclick={() => {
		menuFor = null;
		folderMenuFor = null;
		boardMenuFor = null;
	}}
/>

{#if open}
	{#if ui.isCompact}
		<div class="backdrop" onclick={() => (canvas.sidebarOpen = false)} aria-hidden="true"></div>
	{/if}
	<div class="panel" role="complementary" aria-label="Maps sidebar" transition:slide={{ duration: 160 }}>
		<header>
			<WorkspaceSwitch />
			<button
				type="button"
				class="icon-btn"
				title="Close sidebar"
				aria-label="Close sidebar"
				onclick={() => (canvas.sidebarOpen = false)}
			>
				<Icon name="chevron-left" size={16} />
			</button>
		</header>

		<div class="tree">
			{#if isMindMap}
				<button
					type="button"
					class="tree-row"
					class:active={canvas.mdPaneOpen}
					aria-pressed={canvas.mdPaneOpen}
					title="Toggle MD Editor"
					onclick={() => (canvas.mdPaneOpen = !canvas.mdPaneOpen)}
				>
					<span class="glyph"><Icon name="align-left" size={15} /></span>
					<span class="label">MD Editor</span>
				</button>
			{/if}
			<div class="group-label">Create</div>
			<button
				type="button"
				class="tree-row dropzone"
				class:drag-over={dragTarget === 'root'}
				ondragover={(e) => onDragOver(e, 'root')}
				ondragleave={() => (dragTarget = null)}
				ondrop={(e) => onDrop(e, 'root')}
				onclick={() => workspace.createMap()}
			>
				<span class="glyph"><Icon name="plus" size={15} /></span>
				<span class="label">New map</span>
			</button>

			{#if foldersEnabled}
				{#if addingFolder}
					<input
						class="rename-input new-folder-input"
						bind:value={newFolderDraft}
						placeholder="Folder name"
						use:autofocus
						onkeydown={(e) => {
							if (e.key === 'Enter') commitNewFolder();
							if (e.key === 'Escape') {
								addingFolder = false;
								newFolderDraft = '';
							}
						}}
						onblur={commitNewFolder}
					/>
				{:else}
					<button type="button" class="tree-row" onclick={() => (addingFolder = true)}>
						<span class="glyph"><Icon name="plus" size={15} /></span>
						<span class="label">New folder</span>
					</button>
				{/if}
			{/if}

			<button type="button" class="tree-row" onclick={() => workspace.createBoard()}>
				<span class="glyph"><Icon name="plus" size={15} /></span>
				<span class="label">New Kanban Board</span>
			</button>

			<button type="button" class="tree-row" disabled={importing} onclick={() => fileInput?.click()}>
				<span class="glyph"><Icon name={importing ? 'clock' : 'upload'} size={15} /></span>
				<span class="label">{importing ? 'Importing…' : 'Import .md / .txt'}</span>
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept=".md,.markdown,.txt,text/markdown,text/plain"
				data-testid="import-markdown"
				class="hidden"
				onchange={onFileChosen}
			/>

			{#if unassigned.length > 0}
				<div class="group-label">Mind Maps</div>
				{#each unassigned as map (map.id)}
					{@render MapRow(map)}
				{/each}
			{/if}

			{#if folders.length > 0}
				<div class="group-label">Folders</div>
			{/if}
			{#each folders as folder (folder.id)}
				<div class="folder">
					<div
						class="tree-row folder-head"
						class:drag-over={dragTarget === folder.id}
						role="group"
						ondragover={(e) => onDragOver(e, folder.id)}
						ondragleave={() => (dragTarget = null)}
						ondrop={(e) => onDrop(e, folder.id)}
						ondblclick={() => {
							if (!renaming) startRename('folder', folder.id, folder.name);
						}}
					>
						<button
							type="button"
							class="fold-toggle"
							aria-label={`Toggle folder ${folder.name}`}
							onclick={(e) => {
								e.stopPropagation();
								expanded[folder.id] = !folderExpanded(folder.id);
							}}
						>
							<Icon name={folderExpanded(folder.id) ? 'chevron-down' : 'chevron-right'} size={13} />
						</button>
						<span class="glyph"><Icon name="folder" size={15} /></span>
						{#if renaming?.type === 'folder' && renaming.id === folder.id}
							<input
								class="rename-input"
								bind:value={renameDraft}
								use:autofocus
								onclick={(e) => e.stopPropagation()}
								onkeydown={(e) => {
									e.stopPropagation();
									if (e.key === 'Enter') commitRename();
									if (e.key === 'Escape') renaming = null;
								}}
								onblur={commitRename}
							/>
						{:else}
							<span class="label">{folder.name}</span>
						{/if}
						<span class="count">{folderMaps(folder.id).length}</span>
						<div
							class="menu-wrap"
							use:clickOutside={() => {
								if (folderMenuFor === folder.id) folderMenuFor = null;
							}}
						>
							<button
								type="button"
								class="menu-btn"
								aria-label="Folder actions"
								onclick={(e) => {
									e.stopPropagation();
									folderMenuFor = folderMenuFor === folder.id ? null : folder.id;
									menuFor = null;
									boardMenuFor = null;
								}}
								ondblclick={(e) => e.stopPropagation()}
							>
								<Icon name="more-horizontal" size={16} />
							</button>
							{#if folderMenuFor === folder.id}
								<div class="menu">
									<button type="button" onclick={() => startRename('folder', folder.id, folder.name)}>
										Rename
									</button>
									<button
										type="button"
										onclick={() => {
											workspace.deleteFolder(folder.id);
											folderMenuFor = null;
										}}
									>
										Delete
									</button>
								</div>
							{/if}
						</div>
					</div>

					{#if folderExpanded(folder.id)}
						<div
							class="dropzone"
							class:drag-over={dragTarget === folder.id}
							role="group"
							ondragover={(e) => onDragOver(e, folder.id)}
							ondragleave={() => (dragTarget = null)}
							ondrop={(e) => onDrop(e, folder.id)}
						>
							{#each folderMaps(folder.id) as map (map.id)}
								{@render MapRow(map)}
							{/each}
						</div>
					{/if}
				</div>
			{/each}

			{#if boards.length > 0}
				<div class="group-label">Kanban Boards</div>
			{/if}
			{#each boards as board (board.id)}
				{@render BoardRow(board)}
			{/each}
		</div>

		{#if sync.nudge}
			<div class="nudge">
				<button type="button" class="nudge-text" onclick={() => account.show('plan')}>
					Your maps are on your other device. Sync them for €3.99/month.
				</button>
				<button
					type="button"
					class="nudge-x"
					aria-label="Dismiss"
					onclick={() => sync.dismissNudge()}
				>
					<Icon name="x" size={14} />
				</button>
			</div>
		{/if}
		<button
			type="button"
			class="account-row"
			data-testid="sidebar-account"
			aria-haspopup="dialog"
			aria-label="Account & settings"
			onclick={() => account.show(auth.signedIn ? 'profile' : 'preferences')}
		>
			<span class="account-avatar" aria-hidden="true">
				{#if auth.signedIn}
					{auth.initials}
				{:else}
					<Icon name="user" size={15} />
				{/if}
			</span>
			<span class="account-name" title={accountLabel}>{accountLabel}</span>
			{#if auth.signedIn}
				<span class="account-badge" class:pro={auth.pro}>{planLabel}</span>
			{/if}
		</button>

		{#if auth.signedIn && auth.pro}
			<button type="button" class="status-hint" onclick={() => account.show('plan')}>
				<span
					class="status-dot"
					class:synced={sync.status === 'synced'}
					class:offline={sync.status === 'offline'}
				></span>
				<span class="status-text">{statusLabel}</span>
			</button>
		{:else}
			<button
				type="button"
				class="status-hint"
				onclick={() => account.show(auth.signedIn ? 'plan' : 'account')}
			>
				<span class="status-dot" class:registered={auth.signedIn}></span>
				<span class="status-text">{statusLabel}</span>
			</button>
		{/if}
	</div>

	{#if showAuth}
		<AuthModal />
	{/if}
	{#if versionFor}
		<VersionHistoryModal
			kind={versionFor.kind}
			id={versionFor.id}
			onclose={() => (versionFor = null)}
		/>
	{/if}
	{#if shareFor}
		<ShareModal kind={shareFor.kind} id={shareFor.id} onclose={() => (shareFor = null)} />
	{/if}
{:else}
	<button
		type="button"
		class="handle"
		title="Toggle sidebar"
		aria-label="Toggle sidebar"
		onclick={() => (canvas.sidebarOpen = true)}
	>
		<Icon name="menu" size={18} />
	</button>
{/if}

<SettingsWindow />

{#snippet MapRow(map: MapData)}
	<div
		class="tree-row map-row"
		class:active={activeTabId === map.id}
		role="button"
		tabindex="-1"
		draggable="true"
		ondragstart={(e) => onDragStart(e, map.id)}
		onclick={(e) => {
			if ((e.target as HTMLElement).closest('.menu')) return;
			workspace.openTab(map.id);
		}}
		ondblclick={() => {
			if (!renaming) startRename('map', map.id, map.title);
		}}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				workspace.openTab(map.id);
			}
		}}
	>
		{#if renaming?.type === 'map' && renaming.id === map.id}
			<input
				class="rename-input"
				bind:value={renameDraft}
				use:autofocus
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => {
					e.stopPropagation();
					if (e.key === 'Enter') commitRename();
					if (e.key === 'Escape') renaming = null;
				}}
				onblur={commitRename}
			/>
		{:else}
			<span class="label" title={map.title}>{map.title}</span>
		{/if}
		<div
			class="menu-wrap"
			use:clickOutside={() => {
				if (menuFor === map.id) menuFor = null;
			}}
		>
			<button
				type="button"
				class="menu-btn"
				aria-label={`Actions for ${map.title}`}
				onclick={(e) => {
					e.stopPropagation();
					menuFor = menuFor === map.id ? null : map.id;
					folderMenuFor = null;
				}}
				ondblclick={(e) => e.stopPropagation()}
			>
				<Icon name="more-horizontal" size={16} />
			</button>
			{#if menuFor === map.id}
				<div class="menu">
				<button type="button" onclick={() => startRename('map', map.id, map.title)}>Rename</button>
				<button
					type="button"
					onclick={() => {
						workspace.duplicateMap(map.id);
						menuFor = null;
					}}
				>
					Duplicate
				</button>
				<button
					type="button"
					onclick={() => {
						exportMapMd(map);
						menuFor = null;
					}}
				>
					Export .md
				</button>
				<button
					type="button"
					onclick={() => {
						menuFor = null;
						void exportMapPngAction(map);
					}}
				>
					Export PNG
				</button>
				<button
					type="button"
					onclick={() => {
						versionFor = { kind: 'map', id: map.id };
						menuFor = null;
					}}
				>
					Version history…
				</button>
				<button
					type="button"
					onclick={() => {
						shareFor = { kind: 'map', id: map.id };
						menuFor = null;
					}}
				>
					Share by link…
				</button>
				<button
					type="button"
					class="danger"
					onclick={() => {
						workspace.deleteMap(map.id);
						sync.noteMapDeleted(map.id);
						menuFor = null;
					}}
				>
					Delete
				</button>
				</div>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet BoardRow(board: KanbanBoard)}
	<div
		class="tree-row board-row"
		class:active={activeBoardId === board.id && workspace.viewMode === 'kanban'}
		role="button"
		tabindex="-1"
		onclick={(e) => {
			if ((e.target as HTMLElement).closest('.menu')) return;
			workspace.openBoard(board.id);
		}}
		ondblclick={() => {
			if (!renaming) startRename('board', board.id, board.title);
		}}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				workspace.openBoard(board.id);
			}
		}}
	>
		{#if renaming?.type === 'board' && renaming.id === board.id}
			<input
				class="rename-input"
				bind:value={renameDraft}
				use:autofocus
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => {
					e.stopPropagation();
					if (e.key === 'Enter') commitRename();
					if (e.key === 'Escape') renaming = null;
				}}
				onblur={commitRename}
			/>
		{:else}
			<span class="label" title={board.title}>{board.title}</span>
		{/if}
		<span class="count">{board.columns.length}</span>
		<div
			class="menu-wrap"
			use:clickOutside={() => {
				if (boardMenuFor === board.id) boardMenuFor = null;
			}}
		>
			<button
				type="button"
				class="menu-btn"
				aria-label={`Actions for ${board.title}`}
				onclick={(e) => {
					e.stopPropagation();
					boardMenuFor = boardMenuFor === board.id ? null : board.id;
					menuFor = null;
					folderMenuFor = null;
				}}
				ondblclick={(e) => e.stopPropagation()}
			>
				<Icon name="more-horizontal" size={16} />
			</button>
			{#if boardMenuFor === board.id}
				<div class="menu">
					<button type="button" onclick={() => startRename('board', board.id, board.title)}>
						Rename
					</button>
					<button
						type="button"
						onclick={() => {
							workspace.duplicateBoard(board.id);
							boardMenuFor = null;
						}}
					>
						Duplicate
					</button>
					<button
						type="button"
						onclick={() => {
							versionFor = { kind: 'board', id: board.id };
							boardMenuFor = null;
						}}
					>
						Version history…
					</button>
					<button
						type="button"
						onclick={() => {
							shareFor = { kind: 'board', id: board.id };
							boardMenuFor = null;
						}}
					>
						Share by link…
					</button>
					<button
						type="button"
						class="danger"
						onclick={() => {
							workspace.deleteBoard(board.id);
							sync.noteBoardDeleted(board.id);
							boardMenuFor = null;
						}}
					>
						Delete
					</button>
				</div>
			{/if}
		</div>
	</div>
{/snippet}

<style>
	.panel {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 272px;
		z-index: var(--z-sidebar);
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-right: 1px solid var(--edge);
		box-shadow: 8px 0 24px rgb(0 0 0 / 0.08);
	}

	.backdrop {
		position: absolute;
		inset: 0;
		z-index: var(--z-panel);
		background: rgb(0 0 0 / 0.3);
	}

	@media (max-width: 640px) {
		.panel {
			width: min(320px, 84vw);
			padding-top: env(safe-area-inset-top);
		}
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		height: 48px;
		padding: 0 8px 0 12px;
		border-bottom: 1px solid var(--edge);
	}

	.icon-btn {
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(20px + var(--font-bump));
		line-height: 1;
		cursor: pointer;
		padding: 2px 8px;
		border-radius: var(--r-sm);
	}

	.icon-btn:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.tree {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.tree-row {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 6px 8px;
		border: none;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		text-align: left;
		cursor: pointer;
		transition: background 0.1s ease;
	}

	.tree-row:hover {
		background: var(--surface-2);
	}

	.tree-row.active {
		background: var(--surface-2);
	}

	.tree-row.drag-over,
	.dropzone.drag-over {
		background: color-mix(in srgb, var(--accent) 14%, var(--surface-2));
	}

	.account-row {
		display: flex;
		align-items: center;
		gap: 9px;
		width: calc(100% - 16px);
		margin: 4px 8px 2px;
		padding: 8px 10px;
		border: 1px solid var(--edge);
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		text-align: left;
		cursor: pointer;
	}

	.account-row:hover {
		background: var(--surface-2);
	}

	.account-avatar {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--accent) 14%, var(--surface-2));
		color: var(--accent);
		font-size: calc(11px + var(--font-bump));
		font-weight: 600;
	}

	.account-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 600;
	}

	.account-badge {
		flex: none;
		font-size: calc(9.5px + var(--font-bump));
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
		background: var(--surface-2);
		border-radius: var(--r-xs);
		padding: 2px 7px;
	}

	.account-badge.pro {
		color: var(--accent-fg);
		background: var(--accent);
	}

	.status-hint {
		display: flex;
		align-items: center;
		gap: 7px;
		width: calc(100% - 16px);
		margin: 0 8px 8px;
		padding: 6px 10px;
		border: none;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--muted);
		font-size: calc(11.5px + var(--font-bump));
		text-align: left;
		cursor: pointer;
	}

	.status-hint:hover {
		background: var(--surface-2);
		color: var(--fg);
	}

	.status-dot {
		flex: none;
		width: 7px;
		height: 7px;
		border-radius: 9999px;
		background: var(--edge);
	}

	.status-dot.registered {
		background: var(--warn);
	}

	.status-dot.synced {
		background: var(--success);
	}

	.status-dot.offline {
		background: var(--danger);
	}

	.status-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nudge {
		display: flex;
		align-items: stretch;
		gap: 2px;
		margin: 0 8px 4px;
		border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--edge));
		border-radius: var(--r-sm);
		background: color-mix(in srgb, var(--accent) 8%, var(--surface));
		overflow: hidden;
	}

	.nudge-text {
		flex: 1;
		border: none;
		background: transparent;
		color: var(--fg);
		font-size: calc(11.5px + var(--font-bump));
		line-height: 1.45;
		text-align: left;
		padding: 8px 10px;
		cursor: pointer;
	}

	.nudge-text:hover {
		color: var(--accent);
	}

	.nudge-x {
		flex: none;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(15px + var(--font-bump));
		padding: 0 8px;
		cursor: pointer;
	}

	.nudge-x:hover {
		color: var(--fg);
	}

	.folder-head {
		font-weight: 500;
	}

	.glyph {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		color: var(--muted);
	}

	.label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count {
		flex: none;
		font-size: calc(11px + var(--font-bump));
		color: var(--muted);
	}

	.fold-toggle {
		flex: none;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(11px + var(--font-bump));
		cursor: pointer;
		padding: 0 2px;
		width: 14px;
	}

	.menu-wrap {
		position: relative;
		flex: none;
		display: flex;
	}

	.menu-btn {
		flex: none;
		border: none;
		background: transparent;
		color: var(--muted);
		font-size: calc(15px + var(--font-bump));
		line-height: 1;
		cursor: pointer;
		padding: 0 4px;
		border-radius: 4px;
	}

	.menu-btn:hover {
		color: var(--fg);
		background: var(--surface-2);
	}

	.rename-input {
		flex: 1;
		min-width: 0;
		padding: 3px 6px;
		border: 1px solid var(--accent);
		border-radius: var(--r-sm);
		background: var(--surface);
		color: var(--fg);
		font-size: calc(13px + var(--font-bump));
		outline: none;
	}

	.new-folder-input {
		flex: 0 1 auto;
		width: auto;
		margin: 2px 8px;
	}

	.group-label {
		font-size: calc(11px + var(--font-bump));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
		padding: 8px 8px 4px;
	}

	.menu {
		position: absolute;
		right: 6px;
		top: calc(100% + 2px);
		z-index: 20;
		min-width: 140px;
		background: var(--surface);
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.14);
		padding: 4px;
		display: flex;
		flex-direction: column;
	}

	.menu button {
		text-align: left;
		padding: 7px 10px;
		border: none;
		background: transparent;
		border-radius: var(--r-sm);
		color: var(--fg);
		font-size: calc(12.5px + var(--font-bump));
		cursor: pointer;
	}

	.menu button:hover {
		background: var(--surface-2);
	}

	.menu button.danger {
		color: var(--danger);
	}

	.handle {
		position: absolute;
		top: 12px;
		left: 12px;
		z-index: var(--z-panel);
		width: 34px;
		height: 34px;
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		background: var(--surface);
		color: var(--fg);
		font-size: calc(16px + var(--font-bump));
		cursor: pointer;
		box-shadow: var(--node-shadow);
	}

	.handle:hover {
		background: var(--surface-2);
	}
</style>
