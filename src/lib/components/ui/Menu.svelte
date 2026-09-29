<script lang="ts">
	import Icon, { type IconName } from './Icon.svelte';

	type MenuAction = {
		label: string;
		onselect: () => void;
		icon?: IconName;
		danger?: boolean;
		disabled?: boolean;
	};
	type MenuSeparator = { separator: true };
	export type MenuItem = MenuAction | MenuSeparator;

	let {
		items,
		open = $bindable(true),
		onclose,
		align = 'start',
		class: cls = ''
	}: {
		items: MenuItem[];
		open?: boolean;
		onclose?: () => void;
		align?: 'start' | 'end';
		class?: string;
	} = $props();

	let el = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!open) return;
		const onPointerDown = (event: MouseEvent) => {
			if (el && !el.contains(event.target as Node)) onclose?.();
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.stopPropagation();
				onclose?.();
			}
		};
		document.addEventListener('mousedown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('mousedown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

{#if open}
	<div bind:this={el} class="menu {align} {cls}" role="menu">
		{#each items as item, i (i)}
			{#if 'separator' in item}
				<div class="sep" role="separator"></div>
			{:else}
				<button
					type="button"
					role="menuitem"
					class="item"
					class:danger={item.danger}
					disabled={item.disabled}
					onclick={() => {
						item.onselect();
						onclose?.();
					}}
				>
					{#if item.icon}<Icon name={item.icon} size={15} />{/if}
					<span>{item.label}</span>
				</button>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.menu {
		min-width: 168px;
		padding: 5px;
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		background: var(--surface);
		box-shadow: var(--shadow-2);
		z-index: var(--z-popover);
	}
	.item {
		display: flex;
		align-items: center;
		gap: 9px;
		width: 100%;
		padding: 7px 9px;
		border: 0;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--fg);
		font-family: var(--font-body);
		font-size: calc(13px + var(--font-bump));
		text-align: left;
		cursor: pointer;
		transition: background var(--dur-fast) var(--ease);
	}
	.item:hover:not(:disabled) {
		background: var(--surface-2);
	}
	.item.danger {
		color: var(--danger);
	}
	.item:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.sep {
		height: 1px;
		margin: 5px 4px;
		background: var(--edge);
	}
</style>
