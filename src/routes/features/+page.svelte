<script lang="ts">
	import MarketingLayout from '$lib/components/marketing/MarketingLayout.svelte';
	import { reveal } from '$lib/actions/reveal';

	const SCHEMA = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'MonoMap Features',
		url: 'https://monomap.app/features',
		applicationCategory: 'ProductivityApplication',
		operatingSystem: 'Web',
		description:
			'MonoMap features: infinite canvas mind maps, kanban boards, map-to-board bridge, Markdown split view, offline-first storage and keyboard-first editing.'
	});
</script>

<svelte:head>
	<title>Features — MonoMap Mind Map &amp; Kanban</title>
	<meta
		name="description"
		content="Explore MonoMap features: infinite canvas, kanban boards, mind map to board bridge, live Markdown, notes, offline-first export and keyboard shortcuts."
	/>
	<link rel="canonical" href="https://monomap.app/features" />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="MonoMap" />
	<meta property="og:title" content="Features — MonoMap Mind Map & Kanban" />
	<meta
		property="og:description"
		content="Two workspaces, one toggle. Infinite canvas, kanban, Markdown split view and local-first storage."
	/>
	<meta property="og:url" content="https://monomap.app/features" />
	<meta property="og:image" content="https://monomap.app/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Features — MonoMap" />
	<meta
		name="twitter:description"
		content="Infinite canvas, kanban boards, Markdown split view and offline-first storage."
	/>
	<meta name="twitter:image" content="https://monomap.app/og-image.png" />
</svelte:head>

<MarketingLayout active="features">
	{@html `<script type="application/ld+json">${SCHEMA}</script>`}
	<div class="m-article">
		<div class="m-sec-head" use:reveal>
			<p class="m-eyebrow">Features</p>
			<h1 class="m-h1">Every feature earns its place.</h1>
			<p class="m-section-lede">
				A mind map and a kanban board — done well, keyboard-first, and local-first. Nothing else to
				learn, nothing to configure.
			</p>
		</div>
		<div class="grid" use:reveal={{ delay: 80 }}>
			<div class="card">
				<h2>Infinite canvas</h2>
				<p>Pan, zoom, and drag nodes anywhere. The map grows as big as your thinking.</p>
				<p class="try">Try it: open the app, drag any node, scroll to zoom.</p>
			</div>
			<div class="card">
				<h2>Mind map + kanban toggle</h2>
				<p>Two workspaces, one toggle — flip between canvas and board without reloading.</p>
				<p class="try">Try it: use the workspace switcher in /workspace.</p>
			</div>
			<div class="card">
				<h2>Kanban boards</h2>
				<p>Drag-and-drop cards and columns, labels, due dates, and sub-task checklists.</p>
				<p class="try">Try it: create a board, press N for a new card.</p>
			</div>
			<div class="card">
				<h2>Mind map ↔ board bridge</h2>
				<p>Turn a node into a card, a branch into a board, and jump between them in one click.</p>
				<p class="try">Try it: right-click a node → Send to board.</p>
			</div>
			<div class="card">
				<h2>Live Markdown split view</h2>
				<p>Type an outline on the left, watch the map build itself on the right.</p>
				<p class="try">Try it: toggle the .md pane, paste an outline.</p>
			</div>
			<div class="card">
				<h2>Notes, links &amp; style</h2>
				<p>Attach plain-text notes, links, colors, and icons to any node.</p>
				<p class="try">Try it: select a node, add a note or color.</p>
			</div>
			<div class="card">
				<h2>Organized workspace</h2>
				<p>Folders, multiple tabs, and drag-and-drop organization for maps and boards.</p>
				<p class="try">Try it: drag tabs into folders in the sidebar.</p>
			</div>
			<div class="card">
				<h2>Your data, yours</h2>
				<p>Local-first storage with Markdown, PNG, and JSON export — plus full profile backups.</p>
				<p class="try">Try it: export from the workspace menu anytime.</p>
			</div>
			<div class="card">
				<h2>Instantly responsive</h2>
				<p>Sub-50&nbsp;ms interactions and debounced autosave. No waiting around. Works offline.</p>
				<p class="try">Try it: disconnect Wi-Fi — everything still works.</p>
			</div>
		</div>
		<div class="cta-row">
			<a href="/workspace" class="m-btn-primary">Start mapping <span aria-hidden="true">→</span></a>
			<a href="/benefits" class="m-btn-secondary">Why MonoMap</a>
			<a href="/pricing" class="m-btn-secondary">See pricing</a>
		</div>
	</div>
	<section class="m-cta-band">
		<h2 class="m-cta-title">Stop organizing your tools.<br />Start thinking.</h2>
		<a href="/workspace" class="m-btn-primary btn-lg">Open MonoMap <span aria-hidden="true">→</span></a>
		<p class="m-hero-note">No sign-up · Free · Works offline</p>
	</section>
</MarketingLayout>
