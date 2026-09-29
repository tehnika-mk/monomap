<script lang="ts">
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import { confirmDialog } from '$lib/stores/confirm.svelte';
</script>

<Modal
	open={confirmDialog.open}
	onclose={() => confirmDialog.resolve(false)}
	title={confirmDialog.title}
	size="sm"
>
	<h2 class="title">{confirmDialog.title}</h2>
	{#if confirmDialog.message}
		<p class="message">{confirmDialog.message}</p>
	{/if}
	<div class="actions">
		<Button variant="ghost" onclick={() => confirmDialog.resolve(false)}>
			{confirmDialog.cancelLabel}
		</Button>
		<Button
			variant={confirmDialog.danger ? 'danger' : 'primary'}
			onclick={() => confirmDialog.resolve(true)}
		>
			{confirmDialog.confirmLabel}
		</Button>
	</div>
</Modal>

<style>
	.title {
		margin: 0;
		font-family: var(--font-display);
		font-size: calc(17px + var(--font-bump));
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.message {
		margin: 10px 0 0;
		font-size: calc(13.5px + var(--font-bump));
		line-height: 1.6;
		color: var(--muted);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 22px;
	}
</style>
