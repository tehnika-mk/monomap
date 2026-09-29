<script lang="ts">
	import type { Snippet } from 'svelte';

	type Tone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger';

	let {
		tone = 'neutral',
		children,
		class: cls = ''
	}: { tone?: Tone; children?: Snippet; class?: string } = $props();
</script>

<span class="badge {tone} {cls}">{@render children?.()}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 8px;
		border-radius: var(--r-pill);
		border: 1px solid var(--edge);
		font-family: var(--font-mono);
		font-size: calc(10.5px + var(--font-bump));
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		line-height: 1.4;
		white-space: nowrap;
	}
	.neutral {
		color: var(--muted);
		background: var(--surface-2);
	}
	.accent {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: color-mix(in srgb, var(--accent) 30%, transparent);
	}
	.success {
		color: var(--success);
		background: var(--success-soft);
		border-color: color-mix(in srgb, var(--success) 30%, transparent);
	}
	.warn {
		color: var(--warn);
		background: var(--warn-soft);
		border-color: color-mix(in srgb, var(--warn) 30%, transparent);
	}
	.danger {
		color: var(--danger);
		background: var(--danger-soft);
		border-color: color-mix(in srgb, var(--danger) 30%, transparent);
	}
</style>
