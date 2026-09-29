<script lang="ts">
	import MarketingHeader from './MarketingHeader.svelte';
	import MarketingFooter from './MarketingFooter.svelte';
	import './marketing.css';

	let {
		active = '',
		children
	}: { active?: string; children: import('svelte').Snippet } = $props();
</script>

<div class="dark marketing">
	<MarketingHeader {active} />
	<main class="marketing-main">
		{@render children()}
	</main>
	<MarketingFooter />
</div>
