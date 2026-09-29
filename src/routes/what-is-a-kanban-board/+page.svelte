<script lang="ts">
	import MarketingLayout from '$lib/components/marketing/MarketingLayout.svelte';

	const SCHEMA = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: 'What is a Kanban Board?',
		description:
			'A kanban board is a visual workflow: cards flow left to right across columns like To Do, Doing, Done.',
		author: { '@type': 'Organization', name: 'MonoMap', url: 'https://monomap.app/' },
		mainEntityOfPage: 'https://monomap.app/what-is-a-kanban-board'
	});
</script>

<svelte:head>
	<title>What is a Kanban Board? — MonoMap</title>
	<meta
		name="description"
		content="A kanban board visualizes work: cards move To Do → Doing → Done. Learn the rules and run yours in MonoMap — free, offline, drag-and-drop."
	/>
	<link rel="canonical" href="https://monomap.app/what-is-a-kanban-board" />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="MonoMap" />
	<meta property="og:title" content="What is a Kanban Board? — MonoMap" />
	<meta
		property="og:description"
		content="Cards flowing left to right. Limit WIP, see bottlenecks, finish more — with MonoMap boards."
	/>
	<meta property="og:url" content="https://monomap.app/what-is-a-kanban-board" />
	<meta property="og:image" content="https://monomap.app/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="What is a Kanban Board? — MonoMap" />
	<meta
		name="twitter:description"
		content="To Do → Doing → Done. Run your board in MonoMap, free and offline."
	/>
	<meta name="twitter:image" content="https://monomap.app/og-image.png" />
</svelte:head>

<MarketingLayout active="kanban">
	{@html `<script type="application/ld+json">${SCHEMA}</script>`}
	<div class="m-article">
		<p class="m-eyebrow">Learn · Kanban</p>
		<h1 class="m-h1">What is a Kanban Board?</h1>
		<p class="m-section-lede">
			A kanban board visualizes work: cards flow left to right across columns like To Do, Doing,
			and Done. You see status at a glance — and bottlenecks before they hurt.
		</p>
		<div class="m-article-body">
			<h2>The 3 rules</h2>
			<ul>
				<li><strong>Visualize:</strong> every task is a card in a column.</li>
				<li><strong>Limit WIP:</strong> keep “Doing” small so work actually finishes.</li>
				<li><strong>Pull, don’t push:</strong> move cards right only when there’s capacity.</li>
			</ul>
			<h2>What are they good for?</h2>
			<ul>
				<li><strong>Personal tasks:</strong> today’s 3 cards in Doing, the rest parked in To Do.</li>
				<li><strong>Projects:</strong> one column per stage (Backlog → Writing → Review → Shipped).</li>
				<li><strong>Team triage:</strong> labels, due dates, and checklists per card (Studio can share read-only links).</li>
			</ul>
			<h2>How MonoMap does it</h2>
			<p>
				Drag-and-drop cards and columns, labels, due dates, and sub-task checklists — in the same
				app as your <a href="/what-is-a-mind-map">mind maps</a>. Brainstorm on the canvas, then
				turn a branch into a board in one click. Toggle between map and board without reloading.
				Explore <a href="/features">all features</a> or see how MonoMap compares to
				<a href="/monomap-vs-miro">Miro</a> and <a href="/monomap-vs-xmind">XMind</a>.
			</p>
			<h2>Run one in 60 seconds</h2>
			<ul>
				<li>1. Open <a href="/workspace">MonoMap</a> — no sign-up — and switch to Board.</li>
				<li>2. Add columns: To Do, Doing, Done.</li>
				<li>3. Add 3 cards to To Do, pull one into Doing, drag to Done when finished.</li>
			</ul>
		</div>
		<div class="cta-row">
			<a href="/workspace" class="m-btn-primary">Start your board <span aria-hidden="true">→</span></a>
			<a href="/what-is-a-mind-map" class="m-btn-secondary">Next: mind maps</a>
		</div>
	</div>
	<section class="m-cta-band">
		<h2 class="m-cta-title">Move one card. Finish something.</h2>
		<a href="/workspace" class="m-btn-primary">Open MonoMap <span aria-hidden="true">→</span></a>
		<p class="m-hero-note">No sign-up · Free · Works offline</p>
	</section>
</MarketingLayout>
