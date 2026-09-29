<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from './Icon.svelte';

	let {
		icon,
		title,
		description,
		action,
		class: cls = ''
	}: {
		icon?: IconName;
		title: string;
		description?: string;
		action?: Snippet;
		class?: string;
	} = $props();
</script>

<div class="empty {cls}">
	{#if icon}<span class="empty-icon"><Icon name={icon} size={22} /></span>{/if}
	<h3>{title}</h3>
	{#if description}<p>{description}</p>{/if}
	{#if action}
		<div class="empty-action">{@render action()}</div>
	{/if}
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 40px 24px;
		text-align: center;
		color: var(--muted);
	}
	.empty-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: var(--r-pill);
		background: var(--surface-2);
		color: var(--muted);
		margin-bottom: 4px;
	}
	h3 {
		margin: 0;
		font-size: calc(14px + var(--font-bump));
		font-weight: 600;
		color: var(--fg);
	}
	p {
		margin: 0;
		max-width: 46ch;
		font-size: calc(13px + var(--font-bump));
		line-height: 1.6;
	}
	.empty-action {
		margin-top: 8px;
	}
</style>
