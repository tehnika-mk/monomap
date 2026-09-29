<script lang="ts">
	import Icon, { type IconName } from './Icon.svelte';

	type Variant = 'ghost' | 'secondary' | 'primary';
	type Size = 'sm' | 'md' | 'lg';

	let {
		label,
		name,
		variant = 'ghost',
		size = 'md',
		disabled = false,
		active = false,
		onclick,
		class: cls = ''
	}: {
		label: string;
		name: IconName;
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		active?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
	} = $props();

	const iconSize = $derived(size === 'sm' ? 15 : size === 'lg' ? 20 : 17);
</script>

<button
	type="button"
	class="iconbtn {variant} {size} {cls}"
	class:active
	aria-label={label}
	title={label}
	{disabled}
	{onclick}
>
	<Icon {name} size={iconSize} />
</button>

<style>
	.iconbtn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--r-md);
		border: 1px solid transparent;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		transition:
			background var(--dur) var(--ease),
			color var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.sm {
		width: 26px;
		height: 26px;
	}
	.md {
		width: 32px;
		height: 32px;
	}
	.lg {
		width: 40px;
		height: 40px;
	}
	.ghost:hover:not(:disabled),
	.ghost.active {
		background: var(--surface-2);
		color: var(--fg);
	}
	.secondary {
		border-color: var(--edge);
		background: var(--surface);
	}
	.secondary:hover:not(:disabled) {
		border-color: var(--border-strong);
		color: var(--fg);
	}
	.primary {
		background: var(--accent);
		color: var(--accent-fg);
	}
	.primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}
	.active {
		color: var(--accent);
	}
	.iconbtn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
