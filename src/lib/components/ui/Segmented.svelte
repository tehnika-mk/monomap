<script module lang="ts">
	import type { IconName } from './Icon.svelte';

	export type SegmentedOption<T> = { value: T; label: string; icon?: IconName };
</script>

<script lang="ts" generics="T extends string | number">
	import Icon from './Icon.svelte';

	let {
		options,
		value = $bindable(),
		label,
		class: cls = ''
	}: {
		options: SegmentedOption<T>[];
		value: T;
		label?: string;
		class?: string;
	} = $props();
</script>

<div class="seg {cls}" role="group" aria-label={label}>
	{#each options as option (option.value)}
		<button
			type="button"
			class="seg-btn"
			class:active={value === option.value}
			aria-pressed={value === option.value}
			onclick={() => (value = option.value)}
		>
			{#if option.icon}<Icon name={option.icon} size={15} />{/if}
			<span>{option.label}</span>
		</button>
	{/each}
</div>

<style>
	.seg {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 3px;
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		background: var(--surface-2);
	}
	.seg-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border: 0;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--muted);
		font-family: var(--font-body);
		font-size: calc(12.5px + var(--font-bump));
		font-weight: 500;
		cursor: pointer;
		transition:
			background var(--dur) var(--ease),
			color var(--dur) var(--ease);
	}
	.seg-btn:hover {
		color: var(--fg);
	}
	.seg-btn.active {
		background: var(--surface);
		color: var(--fg);
		box-shadow: var(--shadow-1);
	}
</style>
