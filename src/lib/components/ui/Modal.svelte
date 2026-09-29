<script lang="ts">
	import type { Snippet } from 'svelte';

	type Size = 'sm' | 'md' | 'lg';

	let {
		open,
		onclose,
		title,
		size = 'md',
		children,
		footer
	}: {
		open: boolean;
		onclose: () => void;
		title?: string;
		size?: Size;
		children?: Snippet;
		footer?: Snippet;
	} = $props();

	let dialogEl = $state<HTMLDivElement | null>(null);

	function focusables(): HTMLElement[] {
		if (!dialogEl) return [];
		return Array.from(
			dialogEl.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((node) => node.offsetParent !== null);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			onclose();
			return;
		}
		if (event.key !== 'Tab') return;
		const nodes = focusables();
		if (nodes.length === 0) return;
		const first = nodes[0];
		const last = nodes[nodes.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	$effect(() => {
		if (!open) return;
		const previous = document.activeElement as HTMLElement | null;
		const nodes = focusables();
		(nodes[0] ?? dialogEl)?.focus();
		return () => previous?.focus?.();
	});
</script>

{#if open}
	<div class="backdrop" onclick={onclose} aria-hidden="true"></div>
	<div
		bind:this={dialogEl}
		class="dialog {size}"
		role="dialog"
		aria-modal="true"
		aria-label={title}
		tabindex="-1"
		{onkeydown}
	>
		{#if children}
			<div class="body">{@render children()}</div>
		{/if}
		{#if footer}
			<div class="footer">{@render footer()}</div>
		{/if}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		background: rgb(0 0 0 / 0.4);
		backdrop-filter: blur(2px);
	}
	.dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: var(--z-modal);
		display: flex;
		flex-direction: column;
		max-height: calc(100dvh - 48px);
		overflow: hidden;
		border: 1px solid var(--edge);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow-3);
	}
	.sm {
		width: min(400px, calc(100vw - 32px));
	}
	.md {
		width: min(560px, calc(100vw - 32px));
	}
	.lg {
		width: min(760px, calc(100vw - 48px));
	}
	.body {
		overflow-y: auto;
		padding: 24px;
	}
	.footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding: 16px 24px;
		border-top: 1px solid var(--edge);
	}
	@media (max-width: 640px) {
		.dialog {
			top: auto;
			bottom: 0;
			left: 0;
			transform: none;
			width: 100%;
			max-height: 90dvh;
			border-radius: var(--r-lg) var(--r-lg) 0 0;
			border-bottom: 0;
		}
	}
</style>
