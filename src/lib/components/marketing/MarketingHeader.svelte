<script lang="ts">
	let { active = '' }: { active?: string } = $props();
</script>

<nav class="mnav" aria-label="Main">
	<div class="mnav-inner">
		<a href="/" class="brand" aria-label="MonoMap home">
			<svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
				<circle cx="16" cy="16" r="8" fill="var(--accent)" />
				<circle cx="16" cy="16" r="4.5" fill="var(--canvas)" />
			</svg>
			<span class="brand-name">MonoMap</span>
		</a>
		<div class="mnav-links">
			<a href="/features" class="mnav-link" class:is-active={active === 'features'}>Features</a>
			<a href="/pricing" class="mnav-link" class:is-active={active === 'pricing'}>Pricing</a>
			<a
				href="/what-is-a-mind-map"
				class="mnav-link"
				class:is-active={active === 'mind-map'}>Mind Maps</a
			>
			<a
				href="/what-is-a-kanban-board"
				class="mnav-link"
				class:is-active={active === 'kanban'}>Kanban</a
			>
		</div>
		<a href="/workspace" class="mnav-cta">
			Open the app
			<span aria-hidden="true">→</span>
		</a>
	</div>
</nav>

<style>
	.mnav {
		position: sticky;
		top: 0;
		z-index: var(--z-chrome);
		border-bottom: 1px solid var(--edge);
		background: color-mix(in srgb, var(--canvas) 78%, transparent);
		backdrop-filter: blur(12px);
	}
	.mnav-inner {
		display: flex;
		align-items: center;
		gap: 20px;
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 14px clamp(20px, 4vw, 48px);
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		margin-right: auto;
		color: var(--fg);
		text-decoration: none;
	}
	.brand-name {
		font-family: var(--font-mono);
		font-size: calc(15px + var(--font-bump));
		font-weight: 600;
		letter-spacing: 0.04em;
	}
	.mnav-links {
		display: flex;
		align-items: center;
		gap: 2px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.mnav-links::-webkit-scrollbar {
		display: none;
	}
	.mnav-link {
		padding: 8px 12px;
		border-radius: var(--r-md);
		color: var(--muted);
		font-size: calc(13.5px + var(--font-bump));
		font-weight: 500;
		text-decoration: none;
		white-space: nowrap;
		transition:
			color var(--dur) var(--ease),
			background var(--dur) var(--ease);
	}
	.mnav-link:hover {
		color: var(--fg);
		background: var(--surface);
	}
	.mnav-link.is-active {
		color: var(--fg);
		background: var(--surface-2);
	}
	.mnav-cta {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 6px;
		padding: 9px 16px;
		border-radius: var(--r-md);
		background: var(--accent);
		color: var(--accent-fg);
		font-size: calc(13px + var(--font-bump));
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition: background var(--dur) var(--ease);
	}
	.mnav-cta:hover {
		background: var(--accent-hover);
	}
	@media (max-width: 720px) {
		.mnav-inner {
			gap: 10px;
			padding: 12px 16px;
		}
		.mnav-link {
			padding: 8px 9px;
			font-size: calc(12.5px + var(--font-bump));
		}
		.mnav-cta {
			padding: 8px 12px;
		}
	}
</style>
