<script lang="ts">
	let { size = 16, class: cls = '' }: { size?: number; class?: string } = $props();
</script>

<svg class={cls} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
	<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" opacity="0.25" />
	<path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
</svg>

<style>
	svg {
		display: inline-block;
		flex: none;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
