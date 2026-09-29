<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		side = 'top',
		children
	}: {
		label: string;
		side?: 'top' | 'bottom';
		children?: Snippet;
	} = $props();
</script>

<span class="tt">
	{@render children?.()}
	<span class="tt-tip {side}" role="tooltip">{label}</span>
</span>

<style>
	.tt {
		position: relative;
		display: inline-flex;
	}
	.tt-tip {
		position: absolute;
		left: 50%;
		z-index: var(--z-popover);
		transform: translateX(-50%);
		padding: 5px 9px;
		border-radius: var(--r-sm);
		background: var(--fg);
		color: var(--canvas);
		font-family: var(--font-body);
		font-size: calc(11.5px + var(--font-bump));
		font-weight: 500;
		line-height: 1.4;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--dur) var(--ease);
	}
	.top {
		bottom: calc(100% + 6px);
	}
	.bottom {
		top: calc(100% + 6px);
	}
	.tt:hover .tt-tip,
	.tt:focus-within .tt-tip {
		opacity: 1;
	}
</style>
