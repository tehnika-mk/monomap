export interface ConfirmOptions {
	title: string;
	message?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	danger?: boolean;
}

// Lightweight promise-based confirm dialog, driven by ui/ConfirmDialog.svelte.
// Replaces the native confirm() calls across the app.
class ConfirmState {
	open = $state(false);
	title = $state('');
	message = $state('');
	confirmLabel = $state('Confirm');
	cancelLabel = $state('Cancel');
	danger = $state(false);

	#resolve: ((value: boolean) => void) | null = null;

	ask(options: ConfirmOptions): Promise<boolean> {
		this.title = options.title;
		this.message = options.message ?? '';
		this.confirmLabel = options.confirmLabel ?? 'Confirm';
		this.cancelLabel = options.cancelLabel ?? 'Cancel';
		this.danger = options.danger ?? false;
		this.open = true;
		return new Promise((resolve) => {
			this.#resolve = resolve;
		});
	}

	resolve(value: boolean): void {
		this.open = false;
		this.#resolve?.(value);
		this.#resolve = null;
	}
}

export const confirmDialog = new ConfirmState();
