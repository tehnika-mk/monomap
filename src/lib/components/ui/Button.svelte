<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from './Spinner.svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	let {
		variant = 'secondary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		href,
		full = false,
		children,
		onclick,
		class: cls = ''
	}: {
		variant?: Variant;
		size?: Size;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		href?: string;
		full?: boolean;
		children?: Snippet;
		onclick?: (event: MouseEvent) => void;
		class?: string;
	} = $props();
</script>

{#if href}
	<a class="btn {variant} {size} {cls}" class:full {href} {onclick}>
		{#if loading}<Spinner size={size === 'lg' ? 18 : 15} />{/if}
		{@render children?.()}
	</a>
{:else}
	<button
		class="btn {variant} {size} {cls}"
		class:full
		{type}
		disabled={disabled || loading}
		{onclick}
	>
		{#if loading}<Spinner size={size === 'lg' ? 18 : 15} />{/if}
		{@render children?.()}
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border-radius: var(--r-md);
		border: 1px solid transparent;
		font-family: var(--font-body);
		font-weight: 600;
		line-height: 1;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background var(--dur) var(--ease),
			border-color var(--dur) var(--ease),
			color var(--dur) var(--ease),
			filter var(--dur) var(--ease);
	}
	.sm {
		padding: 7px 12px;
		font-size: calc(12.5px + var(--font-bump));
	}
	.md {
		padding: 10px 16px;
		font-size: calc(13.5px + var(--font-bump));
	}
	.lg {
		padding: 14px 24px;
		font-size: calc(14.5px + var(--font-bump));
	}
	.full {
		width: 100%;
	}
	.primary {
		background: var(--accent);
		color: var(--accent-fg);
		box-shadow: var(--shadow-1);
	}
	.primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}
	.secondary {
		background: var(--surface);
		color: var(--fg);
		border-color: var(--edge);
	}
	.secondary:hover:not(:disabled) {
		background: var(--surface-2);
		border-color: var(--border-strong);
	}
	.ghost {
		background: transparent;
		color: var(--fg);
	}
	.ghost:hover:not(:disabled) {
		background: var(--surface-2);
	}
	.danger {
		background: var(--danger);
		color: var(--danger-fg);
	}
	.danger:hover:not(:disabled) {
		filter: brightness(1.06);
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
