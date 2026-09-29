<footer class="mfooter">
	<div class="mfooter-inner">
		<div class="mfooter-grid">
			<div class="mfooter-brand">
				<a href="/" class="brand" aria-label="MonoMap home">
					<svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
						<circle cx="16" cy="16" r="8" fill="var(--accent)" />
						<circle cx="16" cy="16" r="4.5" fill="var(--canvas)" />
					</svg>
					<span class="brand-name">MonoMap</span>
				</a>
				<p class="footer-tag">One tool. Two workspaces. Zero bloat.</p>
				<p class="footer-note">Local-first mind maps &amp; kanban boards. No sign-up, works offline.</p>
			</div>
			<nav class="mfooter-col" aria-label="Product">
				<h3>Product</h3>
				<a href="/features" class="footer-link">Features</a>
				<a href="/pricing" class="footer-link">Pricing</a>
				<a href="/workspace" class="footer-link">Open the app</a>
			</nav>
			<nav class="mfooter-col" aria-label="Learn">
				<h3>Learn</h3>
				<a href="/what-is-a-mind-map" class="footer-link">What is a Mind Map?</a>
				<a href="/what-is-a-kanban-board" class="footer-link">What is a Kanban Board?</a>
			</nav>
			<nav class="mfooter-col" aria-label="Compare">
				<h3>Compare</h3>
				<a href="/benefits" class="footer-link">Benefits of MonoMap</a>
				<a href="/monomap-vs-miro" class="footer-link">MonoMap vs Miro</a>
				<a href="/monomap-vs-xmind" class="footer-link">MonoMap vs XMind</a>
			</nav>
			<nav class="mfooter-col" aria-label="Company and legal">
				<h3>Company</h3>
				<a href="/privacy" class="footer-link">Privacy Policy</a>
				<a href="/terms" class="footer-link">Terms of Service</a>
				<a
					href="https://www.tehnika.mk"
					target="_blank"
					rel="noopener noreferrer"
					class="footer-link"
				>
					A product by Tehnika
				</a>
				<a
					href="https://github.com/tehnika-mk/monomap"
					target="_blank"
					rel="noopener noreferrer"
					class="footer-link"
				>
					GitHub
				</a>
				<a href="mailto:hello@tehnika.mk" class="footer-link">hello@tehnika.mk</a>
			</nav>
		</div>
		<div class="mfooter-bottom">
			<span class="footer-copy">© 2026 MonoMap</span>
			<a
				href="https://www.tinyshelf.co/?ref=monomap.app"
				title="Featured on tinyshelf"
				class="footer-badge"
			>
				<img
					src="https://www.tinyshelf.co/badge/tinyshelf-badge-dark-f4d1216a.svg"
					alt="Featured on tinyshelf"
					width="216"
					height="64"
					loading="lazy"
				/>
			</a>
		</div>
	</div>
</footer>

<style>
	.mfooter {
		position: relative;
		border-top: 1px solid var(--edge);
		background: color-mix(in srgb, var(--canvas) 92%, #000);
	}
	.mfooter-inner {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 72px clamp(20px, 4vw, 48px) 32px;
	}
	.mfooter-grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr;
		gap: 32px;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		color: var(--fg);
		text-decoration: none;
	}
	.brand-name {
		font-family: var(--font-mono);
		font-size: calc(15px + var(--font-bump));
		font-weight: 600;
		letter-spacing: 0.04em;
	}
	.footer-tag {
		margin: 12px 0 8px;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: calc(12px + var(--font-bump));
	}
	.footer-note {
		margin: 0;
		max-width: 28ch;
		color: var(--muted);
		font-size: calc(13px + var(--font-bump));
		line-height: 1.6;
	}
	.mfooter-col {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
	}
	.mfooter-col h3 {
		margin: 0 0 4px;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: calc(11.5px + var(--font-bump));
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.footer-link {
		color: var(--muted);
		font-size: calc(13.5px + var(--font-bump));
		text-decoration: none;
		transition: color var(--dur) var(--ease);
	}
	.footer-link:hover {
		color: var(--fg);
	}
	.mfooter-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 16px;
		margin-top: 48px;
		padding-top: 22px;
		border-top: 1px solid var(--edge);
		color: var(--muted);
		font-size: calc(12.5px + var(--font-bump));
	}
	.footer-badge img {
		display: block;
		width: 108px;
		height: auto;
	}
	@media (max-width: 860px) {
		.mfooter-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 560px) {
		.mfooter-grid {
			grid-template-columns: 1fr;
			gap: 28px;
		}
		.footer-badge img {
			width: 90px;
		}
	}
</style>
