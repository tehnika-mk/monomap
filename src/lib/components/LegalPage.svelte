<script lang="ts">
	let { title, updated, children }: { title: string; updated: string; children: import('svelte').Snippet } =
		$props();
</script>

<main class="legal">
	<a href="/" class="legal-brand">
		<svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
			<circle cx="16" cy="16" r="8" fill="var(--accent)" />
			<circle cx="16" cy="16" r="4.5" fill="var(--canvas)" />
		</svg>
		MonoMap
	</a>
	<h1>{title}</h1>
	<p class="legal-updated">Last updated: {updated}</p>
	<div class="legal-body">
		{@render children()}
	</div>
</main>

<style>
	.legal {
		width: 100%;
		max-width: var(--content-max);
		margin: 0 auto;
		box-sizing: border-box;
		padding: 72px clamp(20px, 4vw, 48px) 112px;
		background: var(--canvas);
		color: var(--fg);
	}
	.legal,
	.legal * {
		text-align: left;
	}
	.legal-brand {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: calc(13px + var(--font-bump));
		text-decoration: none;
		transition: color var(--dur) var(--ease);
	}
	.legal-brand:hover {
		color: var(--fg);
	}
	h1 {
		margin: 36px 0 8px;
		font-family: var(--font-display);
		font-size: clamp(28px, 4vw, 42px);
		font-weight: 600;
		letter-spacing: -0.025em;
	}
	.legal-updated {
		margin: 0 0 32px;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: calc(12px + var(--font-bump));
	}
</style>
