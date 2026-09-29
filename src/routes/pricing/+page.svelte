<script lang="ts">
	import MarketingLayout from '$lib/components/marketing/MarketingLayout.svelte';
	import { reveal } from '$lib/actions/reveal';

	const SCHEMA = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: 'MonoMap Pro & Studio',
		url: 'https://monomap.app/pricing',
		description:
			'MonoMap pricing: Free local-first plan, Pro cloud sync €3.99/$3.99 per month, Studio version history and share links €7.99/$7.99 per month.',
		brand: { '@type': 'Brand', name: 'MonoMap' },
		offers: [
			{ '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
			{ '@type': 'Offer', name: 'Pro', price: '3.99', priceCurrency: 'EUR' },
			{ '@type': 'Offer', name: 'Studio', price: '7.99', priceCurrency: 'EUR' }
		]
	});
</script>

<svelte:head>
	<title>Pricing — MonoMap Pro &amp; Studio</title>
	<meta
		name="description"
		content="MonoMap pricing: Free forever local-first. Pro sync €3.99/$3.99/mo, Studio history + sharing €7.99/$7.99/mo. Cancel anytime."
	/>
	<link rel="canonical" href="https://monomap.app/pricing" />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="MonoMap" />
	<meta property="og:title" content="Pricing — MonoMap Pro & Studio" />
	<meta
		property="og:description"
		content="Local is free. Sync is a subscription. Pro €3.99/mo, Studio €7.99/mo."
	/>
	<meta property="og:url" content="https://monomap.app/pricing" />
	<meta property="og:image" content="https://monomap.app/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Pricing — MonoMap" />
	<meta name="twitter:description" content="Free forever. Pro sync, Studio history + sharing." />
	<meta name="twitter:image" content="https://monomap.app/og-image.png" />
</svelte:head>

<MarketingLayout active="pricing">
	{@html `<script type="application/ld+json">${SCHEMA}</script>`}
	<div class="m-article">
		<div class="m-sec-head" use:reveal>
			<p class="m-eyebrow">Pricing</p>
			<h1 class="m-h1">Local is free. Sync is a subscription.</h1>
			<p class="m-section-lede">
				MonoMap works fully offline on your device — no account, no cloud, no cost. Pro syncs your
				maps and boards everywhere. Studio adds version history and shareable boards.
			</p>
		</div>

		<div class="pricing" use:reveal={{ delay: 80 }}>
			<div class="plan">
				<h2 class="plan-name">Free</h2>
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
				<h2 class="plan-name">Pro</h2>
				<p class="plan-price">€3.99<span class="plan-per">/month</span></p>
				<p class="plan-alt">$3.99 / month · annual €39.90 / $39.90 (2 months free)</p>
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
				<h2 class="plan-name">Studio</h2>
				<p class="plan-price">€7.99<span class="plan-per">/month</span></p>
				<p class="plan-alt">$7.99 / month · annual €79.90 / $79.90 (2 months free)</p>
				<ul class="plan-features">
					<li>Everything in Pro</li>
					<li>Version history — 25 snapshots per map</li>
					<li>Share boards with a read-only link</li>
					<li>Billed in EUR or USD · cancel anytime</li>
				</ul>
				<a href="/workspace?upgrade=1&tier=studio" class="m-btn-primary plan-cta">Get Studio</a>
			</div>
		</div>

		<h2 class="table-title">Compare plans</h2>
		<div class="table-wrap">
			<table>
				<thead>
					<tr><th>Feature</th><th>Free</th><th>Pro</th><th>Studio</th></tr>
				</thead>
				<tbody>
					<tr><td>Mind maps + kanban boards</td><td>✓</td><td>✓</td><td>✓</td></tr>
					<tr><td>Offline-first, no account</td><td>✓</td><td>✓</td><td>✓</td></tr>
					<tr><td>Markdown / PNG / JSON export</td><td>✓</td><td>✓</td><td>✓</td></tr>
					<tr><td>Cloud sync across devices</td><td>—</td><td>✓</td><td>✓</td></tr>
					<tr><td>Cloud backup</td><td>—</td><td>✓</td><td>✓</td></tr>
					<tr><td>Version history (25 snapshots)</td><td>—</td><td>—</td><td>✓</td></tr>
					<tr><td>Read-only share links</td><td>—</td><td>—</td><td>✓</td></tr>
				</tbody>
			</table>
		</div>

		<h2 class="table-title">Questions</h2>
		<div class="faq">
			<div class="qa"><h3>Do I need an account?</h3><p>No. Free works fully offline with no account. You only sign up if you want Pro or Studio sync.</p></div>
			<div class="qa"><h3>What happens when I cancel?</h3><p>Access continues until the end of the billing period. Your local copy always stays on your device.</p></div>
			<div class="qa"><h3>EUR or USD?</h3><p>Choose at checkout. Monthly and annual billing available — annual gives 2 months free.</p></div>
			<div class="qa"><h3>Do share links need Studio?</h3><p>Yes. Studio enables read-only board links. Viewers need no account. Links stop working if Studio lapses.</p></div>
		</div>
	</div>
	<section class="m-cta-band">
		<h2 class="m-cta-title">Start free. Upgrade when you need sync.</h2>
		<a href="/workspace" class="m-btn-primary btn-lg">Open MonoMap <span aria-hidden="true">→</span></a>
		<p class="m-hero-note">No sign-up · Free · Works offline</p>
	</section>
</MarketingLayout>
