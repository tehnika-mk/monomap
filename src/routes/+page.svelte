<script lang="ts">
	import MarketingLayout from '$lib/components/marketing/MarketingLayout.svelte';
	import { reveal } from '$lib/actions/reveal';

	// Static marketing page — SSR + prerendered. Tab state is local-only.
	let activeTab = $state<'map' | 'board'>('map');

	const SCHEMA = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'MonoMap',
		url: 'https://monomap.app/',
		applicationCategory: 'ProductivityApplication',
		operatingSystem: 'Web',
		description:
			'MonoMap is a single-purpose, keyboard-first, local-first mind map and kanban board app. It opens instantly, works offline, and stays out of the way while you think.',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		author: { '@type': 'Organization', name: 'MonoMap', url: 'https://monomap.app/' }
	});
</script>

<svelte:head>
	<title>MonoMap - Free Mind Map &amp; Kanban App</title>
	<meta
		name="description"
		content="Free, local-first mind map and kanban board app with .md support, zero bloat and minimal interface."
	/>
	<link rel="canonical" href="https://monomap.app/" />
	<meta name="robots" content="index, follow" />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="MonoMap" />
	<meta property="og:title" content="MonoMap - Free Mind Map &amp; Kanban App" />
	<meta
		property="og:description"
		content="Free, local-first mind map and kanban board app with .md support, zero bloat and minimal interface."
	/>
	<meta property="og:url" content="https://monomap.app/" />
	<meta property="og:image" content="https://monomap.app/og-image.png" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="MonoMap - Free Mind Map &amp; Kanban App" />
	<meta
		name="twitter:description"
		content="Free, local-first mind map and kanban board app with .md support, zero bloat and minimal interface."
	/>
	<meta name="twitter:image" content="https://monomap.app/og-image.png" />
</svelte:head>

<MarketingLayout>
	{@html `<script type="application/ld+json">${SCHEMA}</script>`}

	<header class="m-hero">
		<div class="m-hero-glow" aria-hidden="true"></div>
		<div class="m-hero-grid" aria-hidden="true"></div>
		<div class="m-hero-inner">
			<p class="m-eyebrow" use:reveal>Mind map + kanban · local-first</p>
			<h1 class="m-hero-title" use:reveal={{ delay: 60 }}>
				One tool.<br />Two workspaces.<br /><span class="accent">Zero bloat.</span>
			</h1>
			<p class="m-hero-sub" use:reveal={{ delay: 120 }}>
				MonoMap is a keyboard-first, local-first mind map and kanban board. It opens instantly,
				works offline, and never gets in the way of your thinking.
			</p>
			<div class="m-hero-ctas" use:reveal={{ delay: 180 }}>
				<a href="/workspace" class="m-btn-primary btn-lg">Start mapping <span aria-hidden="true">→</span></a>
				<a href="/features" class="m-btn-secondary btn-lg">See what it does</a>
			</div>
			<p class="m-hero-note" use:reveal={{ delay: 240 }}>
				No sign-up · Free · Your maps stay on your device
			</p>

			<div class="m-frame" use:reveal={{ delay: 300 }}>
				<div class="mock-chrome">
					<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
					<div class="mock-tabs" role="tablist" aria-label="Workspace preview">
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === 'map'}
							class="mock-tab"
							class:is-active={activeTab === 'map'}
							onclick={() => (activeTab = 'map')}
						>
							Mind Map
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === 'board'}
							class="mock-tab"
							class:is-active={activeTab === 'board'}
							onclick={() => (activeTab = 'board')}
						>
							Board
						</button>
					</div>
					<span class="mock-url" aria-hidden="true">monomap.app/workspace</span>
				</div>
				<div class="mock-body" data-active={activeTab}>
					<div class="map-panel" role="tabpanel" aria-label="Mind map preview">
						<svg viewBox="0 0 460 340" fill="none" aria-label="A small mind map: a root node connected to child nodes">
							<g class="paths">
								<path d="M 120 170 C 155 170, 155 70, 190 70" />
								<path d="M 120 170 C 155 170, 155 170, 190 170" />
								<path d="M 120 170 C 155 170, 155 270, 190 270" />
								<path d="M 310 70 C 335 70, 335 70, 360 70" />
								<path d="M 310 270 C 335 270, 335 270, 360 270" />
							</g>
							<g class="nodes">
								<rect class="pill root" x="10" y="148" width="110" height="44" rx="10" />
								<text class="label root-label" x="65" y="170">MonoMap</text>
								<rect class="pill" x="190" y="48" width="120" height="44" rx="10" />
								<text class="label" x="250" y="70">Think</text>
								<rect class="pill" x="190" y="148" width="120" height="44" rx="10" />
								<text class="label" x="250" y="170">Note</text>
								<rect class="pill" x="190" y="248" width="120" height="44" rx="10" />
								<text class="label" x="250" y="270">Link</text>
								<rect class="pill" x="360" y="48" width="90" height="44" rx="10" />
								<text class="label" x="405" y="70">Ship</text>
								<rect class="pill" x="360" y="248" width="90" height="44" rx="10" />
								<text class="label" x="405" y="270">Share</text>
							</g>
						</svg>
					</div>
					<div class="kanban-panel" role="tabpanel" aria-label="Kanban board preview">
						<div class="kb-col">
							<p class="kb-col-title">To Do <span class="kb-count">2</span></p>
							<div class="kb-card">
								<span class="kb-dot" style="background:var(--chart-4)"></span>
								<p class="kb-card-title">Outline launch post</p>
								<p class="kb-meta">Note · 2 links</p>
							</div>
							<div class="kb-card">
								<span class="kb-dot" style="background:var(--chart-5)"></span>
								<p class="kb-card-title">Collect examples</p>
								<p class="kb-meta">☑ 2/4 · due Fri</p>
							</div>
						</div>
						<div class="kb-col">
							<p class="kb-col-title">Doing <span class="kb-count">2</span></p>
							<div class="kb-card is-active">
								<span class="kb-dot" style="background:var(--chart-2)"></span>
								<p class="kb-card-title">Map → board bridge</p>
								<p class="kb-meta">☑ 3/5 · in progress</p>
							</div>
							<div class="kb-card">
								<span class="kb-dot" style="background:var(--chart-3)"></span>
								<p class="kb-card-title">Keyboard shortcuts</p>
								<p class="kb-meta">Tab · Enter · Space</p>
							</div>
						</div>
						<div class="kb-col">
							<p class="kb-col-title">Done <span class="kb-count">1</span></p>
							<div class="kb-card is-done">
								<span class="kb-dot" style="background:var(--chart-1)"></span>
								<p class="kb-card-title">✓ Offline-first save</p>
								<p class="kb-meta">Exported .md + PNG</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</header>

	<section class="m-section" id="why" use:reveal>
		<div class="m-sec-head">
			<p class="m-eyebrow">Why MonoMap</p>
			<h2 class="m-section-title">It stays small on purpose.</h2>
			<p class="m-section-lede">
				Most tools grow until they bury your thinking under menus and features. MonoMap does two
				things — mind mapping and kanban — and does them without getting in the way.
			</p>
		</div>
		<div class="principles">
			<div class="principle">
				<span class="principle-num">01</span>
				<h3>One job</h3>
				<p>A mind map and a kanban board. Not a suite, not a dashboard, not a subscription to use.</p>
			</div>
			<div class="principle">
				<span class="principle-num">02</span>
				<h3>Keyboard-first</h3>
				<p>Tab to branch, Enter to continue, Space to rename. Hands never leave the keys.</p>
			</div>
			<div class="principle">
				<span class="principle-num">03</span>
				<h3>Local-first</h3>
				<p>Your maps live in your browser and work offline. Export or back them up any time.</p>
			</div>
		</div>
	</section>

	<section class="m-section" id="features" use:reveal>
		<div class="m-sec-head">
			<p class="m-eyebrow">Features</p>
			<h2 class="m-section-title">Every feature earns its place.</h2>
			<p class="m-section-lede">
				Two workspaces, one toggle — flip between the infinite canvas and a board without reloading.
				<a class="inline-link" href="/features">Explore all features →</a>
			</p>
		</div>
		<div class="feature-grid">
			<div class="feature">
				<h3>Infinite canvas</h3>
				<p>Pan, zoom, and drag nodes anywhere. The map grows as big as your thinking.</p>
			</div>
			<div class="feature">
				<h3>Mind map + Kanban</h3>
				<p>Two workspaces, one toggle — flip between the infinite canvas and a board without reloading.</p>
			</div>
			<div class="feature">
				<h3>Kanban boards</h3>
				<p>Drag-and-drop cards and columns, labels, due dates, and sub-task checklists.</p>
			</div>
			<div class="feature">
				<h3>Mind map ↔ board bridge</h3>
				<p>Turn a node into a card, a branch into a board, and jump between them in one click.</p>
			</div>
			<div class="feature">
				<h3>Live Markdown split view</h3>
				<p>Type an outline on the left, watch the map build itself on the right.</p>
			</div>
			<div class="feature">
				<h3>Notes, links &amp; style</h3>
				<p>Attach plain-text notes, links, colors, and icons to any node.</p>
			</div>
		</div>
		<p class="center-cta"><a href="/features" class="m-btn-secondary">See all features</a></p>
	</section>

	<section class="m-section" id="pricing" use:reveal>
		<div class="m-sec-head">
			<p class="m-eyebrow">Pricing</p>
			<h2 class="m-section-title">Local is free. Sync is a subscription.</h2>
			<p class="m-section-lede">
				MonoMap works fully offline on your device — no account, no cloud, no cost. When you want your
				maps and boards everywhere, MonoMap Pro syncs them across your devices. And when thinking
				becomes work you can't afford to lose, Studio adds version history and shareable boards.
				<a class="inline-link" href="/pricing">Compare plans in detail →</a>
			</p>
		</div>
		<div class="pricing">
			<div class="plan">
				<h3 class="plan-name">Free</h3>
				<p class="plan-price">$0<span class="plan-per">/forever</span></p>
				<ul class="plan-features">
					<li>Mind map &amp; kanban workspaces</li>
					<li>Everything stored locally on your device</li>
					<li>Markdown, PNG &amp; profile export</li>
					<li>Works offline, no account needed</li>
				</ul>
				<a href="/workspace" class="m-btn-secondary plan-cta">Start free</a>
			</div>
			<div class="plan">
				<h3 class="plan-name">Pro</h3>
				<p class="plan-price">€3.99<span class="plan-per">/month</span></p>
				<p class="plan-alt">$3.99 / month &middot; annual &euro;39.90 / $39.90 (2 months free)</p>
				<ul class="plan-features">
					<li>Everything in Free</li>
					<li>Cloud sync across all your devices</li>
					<li>Maps &amp; boards backed up to the cloud</li>
					<li>Billed in EUR or USD · cancel anytime</li>
				</ul>
				<a href="/workspace?upgrade=1" class="m-btn-primary plan-cta">Get Pro</a>
			</div>
			<div class="plan highlight">
				<span class="plan-badge">New</span>
				<h3 class="plan-name">Studio</h3>
				<p class="plan-price">€7.99<span class="plan-per">/month</span></p>
				<p class="plan-alt">$7.99 / month &middot; annual &euro;79.90 / $79.90 (2 months free)</p>
				<ul class="plan-features">
					<li>Everything in Pro</li>
					<li>Version history — 25 snapshots per map</li>
					<li>Share boards with a read-only link</li>
					<li>Billed in EUR or USD · cancel anytime</li>
				</ul>
				<a href="/workspace?upgrade=1&tier=studio" class="m-btn-primary plan-cta">Get Studio</a>
			</div>
		</div>
	</section>

	<section class="m-cta-band">
		<h2 class="m-cta-title">Stop organizing your tools.<br />Start thinking.</h2>
		<a href="/workspace" class="m-btn-primary btn-lg">Start mapping <span aria-hidden="true">→</span></a>
		<p class="m-hero-note">No sign-up · Free · Works offline</p>
	</section>
</MarketingLayout>
