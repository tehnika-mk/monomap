<script lang="ts">
	import MarketingLayout from '$lib/components/marketing/MarketingLayout.svelte';
	import { reveal } from '$lib/actions/reveal';

	const ARTICLE = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: 'The Benefits of MonoMap',
		description:
			'Why use MonoMap: instant, offline-first mind maps and kanban boards with no sign-up, no bloat, and your data kept on your device.',
		author: { '@type': 'Organization', name: 'MonoMap', url: 'https://monomap.app/' },
		mainEntityOfPage: 'https://monomap.app/benefits'
	});

	const FAQ = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'Is MonoMap really free?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Yes. The mind map and kanban workspaces, offline storage, and Markdown, PNG and JSON export are free with no account. Paid plans only add cloud sync (Pro) and version history plus read-only share links (Studio).'
				}
			},
			{
				'@type': 'Question',
				name: 'Do I need an account to use MonoMap?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'No. MonoMap opens straight into the app. You only sign up if you want to sync across devices or use version history and sharing.'
				}
			},
			{
				'@type': 'Question',
				name: 'Does MonoMap work offline?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Yes. MonoMap is local-first: your maps and boards are stored in your browser and every edit is saved on your device, so it keeps working with no connection.'
				}
			},
			{
				'@type': 'Question',
				name: 'Can I export my data out of MonoMap?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Yes. Export any map as Markdown or PNG, and save your entire workspace and settings as a JSON profile you can re-import at any time.'
				}
			},
			{
				'@type': 'Question',
				name: 'How is MonoMap different from a whiteboard tool like Miro?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'MonoMap does two things well: a keyboard-first mind map and a kanban board, in one tab. It is local-first and free with no board cap, where a whiteboard tool like Miro is a broader cloud collaboration platform with paid tiers.'
				}
			}
		]
	});
</script>

<svelte:head>
	<title>Benefits of MonoMap — Why Local-First Mind Mapping Works</title>
	<meta
		name="description"
		content="Why use MonoMap? Instant, offline-first mind maps and kanban boards with no sign-up, no bloat, and your data kept on your device. See the benefits."
	/>
	<link rel="canonical" href="https://monomap.app/benefits" />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="MonoMap" />
	<meta property="og:title" content="Benefits of MonoMap — Why Local-First Mind Mapping Works" />
	<meta
		property="og:description"
		content="Fast, private, offline, and free to start. Six reasons people map and plan with MonoMap."
	/>
	<meta property="og:url" content="https://monomap.app/benefits" />
	<meta property="og:image" content="https://monomap.app/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Benefits of MonoMap" />
	<meta
		name="twitter:description"
		content="Fast, private, offline, and free to start. Six reasons people map and plan with MonoMap."
	/>
	<meta name="twitter:image" content="https://monomap.app/og-image.png" />
</svelte:head>

<MarketingLayout>
	{@html `<script type="application/ld+json">${ARTICLE}</script>`}
	{@html `<script type="application/ld+json">${FAQ}</script>`}
	<div class="m-article">
		<div class="m-sec-head" use:reveal>
			<p class="m-eyebrow">Why MonoMap</p>
			<h1 class="m-h1">The benefits of MonoMap</h1>
			<p class="m-section-lede">
				MonoMap is a keyboard-first, local-first mind map and kanban board. It exists to keep you in
				flow: open it, think, and turn ideas into work — without accounts, menus, or a subscription
				standing in the way.
			</p>
		</div>

		<div class="m-article-body">
			<h2>1. You think at the speed of thought</h2>
			<p>
				MonoMap opens in about a second and every action lands in under 50&nbsp;ms. Nodes are
				created from the keyboard — <kbd>Tab</kbd> to branch, <kbd>Enter</kbd> for a sibling,
				<kbd>Space</kbd> to rename — so your hands never leave the keys. Ideas get captured at the
				moment you have them instead of after you find the right menu.
			</p>

			<h2>2. Your ideas stay yours</h2>
			<p>
				Most tools put your thinking on someone else's server. MonoMap is local-first: your maps
				and boards live in your browser and save to your device as you work. There is no account
				required, no tracking of what you write, and no cloud between you and your notes. When you
				do want a copy, export Markdown, PNG, or a full JSON profile — your work is never trapped.
			</p>

			<h2>3. One tool, two workspaces</h2>
			<p>
				Brainstorming and doing usually live in different apps, so ideas get lost in the gap.
				MonoMap puts a mind map and a kanban board in one tab with a single toggle. Turn a node
				into a card, or a whole branch into a board, then jump back and forth in one click. See
				<a href="/what-is-a-mind-map">what a mind map is</a> and
				<a href="/what-is-a-kanban-board">what a kanban board is</a>.
			</p>

			<h2>4. Nothing to learn, nothing to configure</h2>
			<p>
				There are no plugins to install, templates to pick, or settings to tune before you start.
				MonoMap does two things and does them well — a deliberate choice against the
				feature-bloated suite. If you can press <kbd>Tab</kbd>, you already know how to use it.
				See the full <a href="/features">feature list</a>.
			</p>

			<h2>5. Free to use, sync only if you want</h2>
			<p>
				The app is free, with no board cap and no watermarks. Add <strong>Pro</strong> only when
				you want your maps and boards on every device, or <strong>Studio</strong> when you need
				version history and read-only share links. No one is forced into a subscription to keep
				working. Compare options on the <a href="/pricing">pricing page</a>.
			</p>

			<h2>6. It works wherever you do</h2>
			<p>
				Because everything is local, MonoMap keeps working on a plane, on a train, or on a bad
				hotel Wi-Fi. It runs in any modern browser and installs to your phone or desktop, and
				nothing you create waits on a spinner.
			</p>

			<h2>Who gets the most out of MonoMap</h2>
			<div class="who">
				<div class="who-card">
					<h3>Students</h3>
					<p>One map per chapter, then a board to plan revision and assignments.</p>
				</div>
				<div class="who-card">
					<h3>Founders &amp; PMs</h3>
					<p>Sketch a plan on the canvas, push the branches straight into a board.</p>
				</div>
				<div class="who-card">
					<h3>Writers</h3>
					<p>Outline non-linearly, arrange, then export the structure as Markdown.</p>
				</div>
				<div class="who-card">
					<h3>Anyone offline</h3>
					<p>Keep thinking and planning with no connection and no sign-up.</p>
				</div>
			</div>

			<h2>Frequently asked</h2>
			<div class="faq">
				<div class="qa">
					<h3>Is MonoMap really free?</h3>
					<p>
						Yes. The mind map and kanban workspaces, offline storage, and Markdown, PNG and JSON
						export are free with no account. Paid plans only add cloud sync (Pro) and version
						history plus read-only share links (Studio).
					</p>
				</div>
				<div class="qa">
					<h3>Do I need an account?</h3>
					<p>
						No. MonoMap opens straight into the app. You only sign up if you want to sync across
						devices or use version history and sharing.
					</p>
				</div>
				<div class="qa">
					<h3>Does it work offline?</h3>
					<p>
						Yes. Your maps and boards are stored in your browser and every edit is saved on your
						device, so it keeps working with no connection.
					</p>
				</div>
				<div class="qa">
					<h3>Can I export my data?</h3>
					<p>
						Yes. Export any map as Markdown or PNG, and save your entire workspace and settings
						as a JSON profile you can re-import at any time.
					</p>
				</div>
				<div class="qa">
					<h3>How is it different from Miro?</h3>
					<p>
						MonoMap is a focused, local-first map and board, free with no board cap. See the
						<a href="/monomap-vs-miro">MonoMap vs Miro comparison</a>.
					</p>
				</div>
				<div class="qa">
					<h3>How is it different from XMind?</h3>
					<p>
						XMind is a polished desktop mapper with many diagram types; MonoMap adds a native
						kanban board and runs free in the browser. See the
						<a href="/monomap-vs-xmind">MonoMap vs XMind comparison</a>.
					</p>
				</div>
			</div>

			<div class="cta-row">
				<a href="/workspace" class="m-btn-primary">Try MonoMap <span aria-hidden="true">→</span></a>
				<a href="/features" class="m-btn-secondary">See all features</a>
			</div>
		</div>
	</div>
	<section class="m-cta-band">
		<h2 class="m-cta-title">Think faster. Own your notes.</h2>
		<a href="/workspace" class="m-btn-primary btn-lg">Open MonoMap <span aria-hidden="true">→</span></a>
		<p class="m-hero-note">No sign-up · Free · Works offline</p>
	</section>
</MarketingLayout>
