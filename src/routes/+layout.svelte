<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>MonoMap - Free Mind Map App</title>
	<meta name="theme-color" content="#f7f7f5" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#0b0b0d" media="(prefers-color-scheme: dark)" />
	<meta name="description" content="Free, local-first mind map app with .md support, zero bloat and minimal interface." />
	<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='8' fill='%232f6bff'/%3E%3Ccircle cx='16' cy='16' r='4.5' fill='%23f7f7f5'/%3E%3C/svg%3E" />

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}
