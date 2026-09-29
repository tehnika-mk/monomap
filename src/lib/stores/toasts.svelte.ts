export type ToastKind = 'success' | 'info' | 'error';

export interface ToastAction {
	label: string;
	run: () => void;
}

export interface Toast {
	id: number;
	message: string;
	kind: ToastKind;
	action?: ToastAction;
}

const DEFAULT_DURATION_MS = 3200;

export class ToastState {
	items = $state<Toast[]>([]);
	private seq = 0;

	push(message: string, kind: ToastKind = 'success', duration = DEFAULT_DURATION_MS, action?: ToastAction): number {
		const id = ++this.seq;
		this.items = [...this.items, { id, message, kind, action }];
		if (duration > 0) setTimeout(() => this.dismiss(id), duration);
		return id;
	}

	dismiss(id: number): void {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toasts = new ToastState();
