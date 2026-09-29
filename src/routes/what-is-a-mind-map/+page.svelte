<script lang="ts">
	import MarketingLayout from '$lib/components/marketing/MarketingLayout.svelte';

	const SCHEMA = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: 'What is a Mind Map?',
		description:
			'A mind map is a radial diagram for brainstorming, studying and planning: a central topic with branching ideas.',
		author: { '@type': 'Organization', name: 'MonoMap', url: 'https://monomap.app/' },
		mainEntityOfPage: 'https://monomap.app/what-is-a-mind-map'
	});
</script>

<svelte:head>
	<title>What is a Mind Map? — MonoMap</title>
	<meta
		name="description"
		content="A mind map is a radial diagram: central topic, branching ideas. Learn the rules, uses, and how to make one in MonoMap — free, offline, keyboard-first."
	/>
	<link rel="canonical" href="https://monomap.app/what-is-a-mind-map" />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="MonoMap" />
	<meta property="og:title" content="What is a Mind Map? — MonoMap" />
	<meta
		property="og:description"
		content="Radial notes that mirror how ideas branch. Brainstorm, study, plan — then turn branches into kanban cards."
	/>
	<meta property="og:url" content="https://monomap.app/what-is-a-mind-map" />
	<meta property="og:image" content="https://monomap.app/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="What is a Mind Map? — MonoMap" />
	<meta
		name="twitter:description"
		content="Central topic, branching ideas, one keyword per node. Make yours in MonoMap."
	/>
	<meta name="twitter:image" content="https://monomap.app/og-image.png" />
</svelte:head>

<MarketingLayout active="mind-map">
	{@html `<script type="application/ld+json">${SCHEMA}</script>`}
	<div class="m-article">
		<p class="m-eyebrow">Learn · Mind mapping</p>
		<h1 class="m-h1">What is a Mind Map?</h1>
		<p class="m-section-lede">
			A mind map is a radial diagram: start with one central topic, then branch out into related
			ideas. It mirrors how thinking actually works — associative, visual, non-linear.
		</p>
		<div class="m-article-body">
			<h2>The 3 rules</h2>
			<ul>
				<li><strong>One center:</strong> a single topic in the middle (e.g. “Launch”, “Thesis”, “Trip”).</li>
				<li><strong>Branch out:</strong> child nodes for sub-ideas; keep one keyword per node.</li>
				<li><strong>Grow freely:</strong> rearrange, color, and link — the map grows as big as your thinking.</li>
			</ul>
			<h2>What are they good for?</h2>
			<ul>
				<li><strong>Brainstorming:</strong> capture fast without judging, then cluster.</li>
				<li><strong>Studying:</strong> one map per chapter beats ten pages of linear notes.</li>
				<li><strong>Planning:</strong> break a goal into branches, then turn branches into tasks.</li>
				<li><strong>Writing:</strong> outline left-to-right, then export the outline as Markdown.</li>
			</ul>
			<h2>How MonoMap does it</h2>
			<p>
				Infinite canvas, <kbd>Tab</kbd> to branch, <kbd>Enter</kbd> to continue,
				<kbd>Space</kbd> to rename. Live Markdown split view builds the map as you type. Notes,
				links, colors, and icons attach to any node. Everything stays local and works offline.
			</p>
			<p>
				When thinking becomes doing, turn a node into a card or a branch into a board — see
				<a href="/what-is-a-kanban-board">What is a Kanban Board?</a> — and explore
				<a href="/features">all features</a>. Curious how it stacks up? See how MonoMap compares
				to <a href="/monomap-vs-miro">Miro</a> and <a href="/monomap-vs-xmind">XMind</a>.
			</p>
			<h2>Make one in 60 seconds</h2>
			<ul>
				<li>1. Open <a href="/workspace">MonoMap</a> — no sign-up.</li>
				<li>2. Rename the center node to your topic.</li>
				<li>3. Press <kbd>Tab</kbd> to branch, type an idea, press <kbd>Enter</kbd> for siblings.</li>
				<li>4. Drag to arrange, export as Markdown or PNG.</li>
			</ul>
		</div>
		<div class="cta-row">
			<a href="/workspace" class="m-btn-primary">Make your mind map <span aria-hidden="true">→</span></a>
			<a href="/what-is-a-kanban-board" class="m-btn-secondary">Next: kanban boards</a>
		</div>
	</div>
	<section class="m-cta-band">
		<h2 class="m-cta-title">Start with a blank canvas.</h2>
		<a href="/workspace" class="m-btn-primary">Open MonoMap <span aria-hidden="true">→</span></a>
		<p class="m-hero-note">No sign-up · Free · Works offline</p>
	</section>
</MarketingLayout>
