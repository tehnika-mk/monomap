<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts } from '$lib/stores/toasts.svelte';
</script>

{#if toasts.items.length > 0}
	<div class="toasts" role="status" aria-live="polite">
		{#each toasts.items as toast (toast.id)}
			<div
				class="toast"
				class:success={toast.kind === 'success'}
				class:error={toast.kind === 'error'}
				transition:fly={{ y: 12, duration: 160 }}
			>
				<button type="button" class="message" onclick={() => toasts.dismiss(toast.id)}>
					{toast.message}
				</button>
				{#if toast.action}
					<button
						type="button"
						class="action"
						onclick={() => {
							toast.action?.run();
							toasts.dismiss(toast.id);
						}}
					>
						{toast.action.label}
					</button>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.toasts {
		position: fixed;
		bottom: 56px;
		left: 50%;
		transform: translateX(-50%);
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		pointer-events: none;
	}

	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 4px;
		max-width: min(360px, calc(100vw - 32px));
		padding: 5px 6px 5px 16px;
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		background: var(--surface);
		color: var(--fg);
		font-size: calc(12.5px + var(--font-bump));
		font-weight: 500;
		box-shadow: var(--shadow-2);
	}

	.message {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		padding: 4px 0;
	}

	.action {
		flex: none;
		border: none;
		background: transparent;
		color: var(--accent);
		font-size: calc(12.5px + var(--font-bump));
		font-weight: 700;
		cursor: pointer;
		padding: 4px 10px;
		border-radius: var(--r-sm);
	}

	.action:hover {
		background: var(--surface-2);
	}

	.toast.success {
		border-color: color-mix(in srgb, var(--success) 45%, var(--edge));
	}

	.toast.error {
		color: var(--danger);
		border-color: color-mix(in srgb, var(--danger) 45%, var(--edge));
	}
</style>
