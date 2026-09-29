<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { sync } from '$lib/stores/sync.svelte';
	import { isStudio, type PaidTier } from '$lib/supabase';
	import { confirmDialog } from '$lib/stores/confirm.svelte';

	let canceling = $state(false);
	let cancelledOn = $state<string | null>(null);

	let tier = $state<PaidTier>(auth.pendingUpgradeTier);
	let period = $state<'monthly' | 'annual'>('annual');
	let currency = $state<'EUR' | 'USD'>(readCurrency());

	const PRICES: Record<PaidTier, Record<'monthly' | 'annual', Record<'EUR' | 'USD', string>>> = {
		pro: {
			monthly: { EUR: '€3.99/month', USD: '$3.99/month' },
			annual: { EUR: '€39.90/year', USD: '$39.90/year' }
		},
		studio: {
			monthly: { EUR: '€7.99/month', USD: '$7.99/month' },
			annual: { EUR: '€79.90/year', USD: '$79.90/year' }
		}
	};

	const priceLabel = $derived(PRICES[tier][period][currency]);
	const studioPriceLabel = $derived(PRICES.studio[period][currency]);
	const tierName = $derived(tier === 'studio' ? 'Studio' : 'Pro');

	function readCurrency(): 'EUR' | 'USD' {
		try {
			return localStorage.getItem('mindmap:currency') === 'USD' ? 'USD' : 'EUR';
		} catch {
			return 'EUR';
		}
	}

	function setCurrency(next: 'EUR' | 'USD') {
		currency = next;
		try {
			localStorage.setItem('mindmap:currency', next);
		} catch {
			/* storage unavailable; selection still applies this session */
		}
	}

	const isCancelled = $derived(!!auth.profile?.cancel_at_period_end || !!cancelledOn);
	const periodEndLabel = $derived(
		(auth.profile?.current_period_end || cancelledOn)
			? formatDate((auth.profile?.current_period_end || cancelledOn)!)
			: null
	);

	const syncLabel = $derived(
		sync.status === 'synced'
			? 'Synced'
			: sync.status === 'syncing'
				? 'Syncing…'
				: sync.status === 'offline'
					? 'Offline'
					: sync.status === 'paused'
						? 'Free plan'
						: 'Not syncing'
	);

	const periodLabel = $derived(
		auth.profile?.current_period_end ? formatDate(auth.profile.current_period_end) : null
	);

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	async function upgrade() {
		const url = await auth.startCheckout(tier, period, currency);
		if (url) window.location.href = url;
	}

	async function moveToStudio() {
		const url = await auth.startCheckout('studio', period, currency);
		if (url) window.location.href = url;
	}

	async function cancel() {
		if (canceling) return;
		const ok = await confirmDialog.ask({
			title: 'Cancel subscription?',
			message: "You'll keep access until the end of the current billing period.",
			confirmLabel: 'Cancel subscription',
			cancelLabel: 'Keep plan',
			danger: true
		});
		if (!ok) return;
		canceling = true;
		const periodEnd = await auth.cancelSubscription();
		canceling = false;
		if (periodEnd) cancelledOn = periodEnd;
	}
</script>

<section class="section">
	<h3 class="section-title">Plan &amp; Billing</h3>

	{#if auth.pro}
		<div class="sync-status">
			<span class="sync-dot" class:synced={sync.status === 'synced'}></span>
			<span class="sync-text">Sync: {syncLabel}</span>
		</div>
	{/if}

	{#if auth.error}
		<p class="note error" role="alert">{auth.error}</p>
	{/if}

	{#if !auth.pro}
		<p class="note">You're on the Free plan. Upgrade to sync your maps across devices.</p>
		<div class="seg" role="group" aria-label="Plan">
			<button type="button" class="seg-btn" class:on={tier === 'pro'} onclick={() => (tier = 'pro')}>
				Pro
			</button>
			<button
				type="button"
				class="seg-btn"
				class:on={tier === 'studio'}
				onclick={() => (tier = 'studio')}
			>
				Studio
				<span class="save">New</span>
			</button>
		</div>
		<div class="seg" role="group" aria-label="Billing period">
			<button
				type="button"
				class="seg-btn"
				class:on={period === 'annual'}
				onclick={() => (period = 'annual')}
			>
				Annual
				<span class="save">2 months free</span>
			</button>
			<button
				type="button"
				class="seg-btn"
				class:on={period === 'monthly'}
				onclick={() => (period = 'monthly')}
			>
				Monthly
			</button>
		</div>
		<div class="currency-row">
			<span class="currency-label">Currency</span>
			<div class="seg" role="group" aria-label="Currency">
				<button
					type="button"
					class="seg-btn"
					class:on={currency === 'EUR'}
					onclick={() => setCurrency('EUR')}
				>
					EUR €
				</button>
				<button
					type="button"
					class="seg-btn"
					class:on={currency === 'USD'}
					onclick={() => setCurrency('USD')}
				>
					USD $
				</button>
			</div>
		</div>
		<div class="actions">
			<button type="button" class="btn primary" onclick={() => void upgrade()}>
				Upgrade to {tierName} · {priceLabel}
			</button>
		</div>
		<p class="note tiny">
			{tier === 'studio'
				? 'Studio adds version history (25 snapshots per map) and shareable board links, on top of Pro.'
				: 'Pro keeps your maps and boards synced across all your devices.'}
		</p>
	{:else if isCancelled}
		<p class="note cancelled">
			Cancelled. You have {isStudio(auth.profile) ? 'Studio' : 'Pro'} access until {periodEndLabel}.
		</p>
	{:else}
		<p class="note">
			Receipts are emailed to {auth.user?.email} automatically after each charge.
			{#if periodLabel}Subscribing renews on {periodLabel}.{/if}
		</p>
		{#if !isStudio(auth.profile)}
			<div class="currency-row">
				<span class="currency-label">Billing period</span>
				<div class="seg" role="group" aria-label="Billing period">
					<button
						type="button"
						class="seg-btn"
						class:on={period === 'annual'}
						onclick={() => (period = 'annual')}
					>
						Annual
					</button>
					<button
						type="button"
						class="seg-btn"
						class:on={period === 'monthly'}
						onclick={() => (period = 'monthly')}
					>
						Monthly
					</button>
				</div>
			</div>
			<div class="currency-row">
				<span class="currency-label">Currency</span>
				<div class="seg" role="group" aria-label="Currency">
					<button
						type="button"
						class="seg-btn"
						class:on={currency === 'EUR'}
						onclick={() => setCurrency('EUR')}
					>
						EUR €
					</button>
					<button
						type="button"
						class="seg-btn"
						class:on={currency === 'USD'}
						onclick={() => setCurrency('USD')}
					>
						USD $
					</button>
				</div>
			</div>
			<div class="actions">
				<button type="button" class="btn primary" onclick={() => void moveToStudio()}>
					Upgrade to Studio · {studioPriceLabel}
				</button>
			</div>
			<p class="note tiny">
				Version history + shareable boards. Your Pro plan is parked at period end when you switch.
			</p>
		{/if}
		<div class="actions">
			<button type="button" class="btn danger" disabled={canceling} onclick={() => void cancel()}>
				{canceling ? 'Cancelling…' : 'Cancel subscription'}
			</button>
		</div>
	{/if}
</section>

<style>
	.section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.section-title {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: calc(15px + var(--font-bump));
		font-weight: 600;
		margin: 0 0 2px;
	}

	.sync-status {
		display: flex;
		align-items: center;
		gap: 7px;
	}

	.sync-dot {
		flex: none;
		width: 7px;
		height: 7px;
		border-radius: 9999px;
		background: var(--edge);
	}

	.sync-dot.synced {
		background: var(--success);
	}

	.sync-text {
		font-size: calc(12px + var(--font-bump));
		color: var(--muted);
	}

	.note {
		font-size: calc(12.5px + var(--font-bump));
		color: var(--muted);
		line-height: 1.55;
		margin: 0;
	}

	.note.cancelled {
		color: var(--warn);
	}

	.note.error {
		color: var(--danger);
	}

	.note.tiny {
		font-size: calc(11px + var(--font-bump));
		line-height: 1.5;
	}

	.seg {
		display: flex;
		gap: 4px;
		padding: 3px;
		border: 1px solid var(--edge);
		border-radius: var(--r-md);
		background: var(--surface-2);
	}

	.seg-btn {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 6px 8px;
		border: none;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--muted);
		font-size: calc(12px + var(--font-bump));
		font-weight: 500;
		cursor: pointer;
	}

	.seg-btn:hover {
		color: var(--fg);
	}

	.seg-btn.on {
		background: var(--surface);
		color: var(--fg);
		box-shadow: 0 1px 4px rgb(0 0 0 / 0.12);
	}

	.seg-btn .save {
		font-size: calc(10px + var(--font-bump));
		font-weight: 600;
		color: var(--accent-fg);
		background: var(--accent);
		border-radius: var(--r-xs);
		padding: 1px 7px;
	}

	.currency-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
	}

	.currency-label {
		font-size: calc(11px + var(--font-bump));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}

	.currency-row .seg-btn {
		flex: none;
		padding: 4px 12px;
	}

	.actions {
		display: flex;
		margin-top: 4px;
	}

	.btn {
		flex: 1;
		padding: 10px;
		border: 1px solid var(--edge);
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--fg);
		font-size: calc(12.5px + var(--font-bump));
		font-weight: 600;
		cursor: pointer;
	}

	.btn.primary {
		border-color: transparent;
		background: var(--accent);
		color: var(--accent-fg);
	}

	.btn.primary:hover:not(:disabled) {
		filter: brightness(1.05);
	}

	.btn.danger {
		color: var(--danger);
	}

	.btn.danger:hover {
		background: color-mix(in srgb, var(--danger) 10%, var(--surface-2));
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: default;
	}
</style>
