<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		hint,
		error,
		children,
		class: cls = ''
	}: {
		label: string;
		hint?: string;
		error?: string;
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<label class="field {cls}">
	<span class="field-label">{label}</span>
	{@render children?.()}
	{#if error}
		<span class="field-msg error" role="alert">{error}</span>
	{:else if hint}
		<span class="field-msg hint">{hint}</span>
	{/if}
</label>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}
	.field-label {
		font-family: var(--font-mono);
		font-size: calc(11px + var(--font-bump));
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.field :global(input),
	.field :global(select),
	.field :global(textarea) {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		background: var(--surface-2);
		color: var(--fg);
		font-family: var(--font-body);
		font-size: calc(13.5px + var(--font-bump));
		outline: none;
		transition:
			border-color var(--dur) var(--ease),
			box-shadow var(--dur) var(--ease);
	}
	.field :global(input:focus),
	.field :global(select:focus),
	.field :global(textarea:focus) {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--ring);
	}
	.field :global(input[readonly]) {
		color: var(--muted);
		cursor: default;
	}
	.field-msg {
		font-size: calc(12px + var(--font-bump));
		line-height: 1.5;
	}
	.field-msg.hint {
		color: var(--muted);
	}
	.field-msg.error {
		color: var(--danger);
	}
</style>
