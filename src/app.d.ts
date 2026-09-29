// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		// Debug/test hook — exposes live stores.
		__mindmap?: {
			workspace: import('$lib/stores/workspace.svelte').WorkspaceState;
			canvas: import('$lib/stores/canvas.svelte').CanvasState;
			auth: import('$lib/stores/auth.svelte').AuthState;
			sync: import('$lib/stores/sync.svelte').SyncState;
			versions: import('$lib/stores/versions.svelte').VersionsState;
			account: import('$lib/stores/account.svelte').AccountState;
			kanban: import('$lib/stores/kanban.svelte').KanbanState;
		};
	}
}

export {};
