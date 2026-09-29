import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AGENTAOS_API_KEY = Deno.env.get('AGENTAOS_API_KEY')!;
const AGENTAOS_API = 'https://api.agentaos.ai/api/v1';

type Tier = 'pro' | 'studio';

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

const TIER_BY_LINK: Record<string, Tier> = {};
for (const [env, tier] of [
	['AGENTAOS_PRODUCT_ID', 'pro'],
	['AGENTAOS_PRODUCT_ID_ANNUAL', 'pro'],
	['AGENTAOS_PRODUCT_ID_USD', 'pro'],
	['AGENTAOS_PRODUCT_ID_ANNUAL_USD', 'pro'],
	['AGENTAOS_PRODUCT_ID_STUDIO', 'studio'],
	['AGENTAOS_PRODUCT_ID_STUDIO_ANNUAL', 'studio'],
	['AGENTAOS_PRODUCT_ID_STUDIO_USD', 'studio'],
	['AGENTAOS_PRODUCT_ID_STUDIO_ANNUAL_USD', 'studio']
] as const) {
	const id = Deno.env.get(env);
	if (id) TIER_BY_LINK[id] = tier;
}

function tierForSubscription(sub: Record<string, unknown>): Tier | null {
	const linkId = (sub?.linkId ?? sub?.productId ?? (sub?.metadata as any)?.linkId ??
		(sub?.metadata as any)?.productId) as string | null | undefined;
	if (linkId && TIER_BY_LINK[linkId]) return TIER_BY_LINK[linkId];
	const named = ((sub?.metadata as any)?.tier ?? sub?.planName) as string | null | undefined;
	if (named === 'studio' || named === 'pro') return named;
	return null;
}

async function listSubscriptions() {
	let offset = 0;
	const all: any[] = [];
	while (true) {
		const res = await fetch(`${AGENTAOS_API}/gateway/subscriptions?limit=100&offset=${offset}`, {
			headers: { 'x-api-key': AGENTAOS_API_KEY }
		});
		const json = await res.json();
		all.push(...(json.items ?? []));
		if (!json.hasMore) break;
		offset += json.items?.length ?? 0;
	}
	return all;
}

Deno.serve(async () => {
	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	// Everyone on a paid tier.
	const { data: profiles, error } = await supabase
		.from('profiles')
		.select('*')
		.in('plan', ['pro', 'studio']);
	if (error) {
		console.error('reconcile: failed to load profiles', error);
		return new Response('Failed', { status: 500 });
	}

	let subscriptions: any[] = [];
	try {
		subscriptions = await listSubscriptions();
	} catch (err) {
		console.error('reconcile: failed to list subscriptions', err);
		return new Response('Failed', { status: 500 });
	}

	const byEmail = new Map<string, any[]>();
	for (const sub of subscriptions) {
		const email = sub.customerEmail?.toLowerCase();
		if (!email) continue;
		const list = byEmail.get(email) ?? [];
		list.push(sub);
		byEmail.set(email, list);
	}

	const now = new Date().toISOString();
	const updated = [];
	const downgraded = [];

	for (const profile of profiles ?? []) {
		const subs = byEmail.get(profile.email.toLowerCase()) ?? [];
		const active = subs.filter((s) => ACTIVE_STATUSES.has(s.status));
		// Prefer the open subscription; fall back to one already parked at period end.
		const sub =
			active.find((s) => s.cancelAtPeriodEnd !== true) ?? active[0] ?? null;

		if (sub) {
			const detectedTier = tierForSubscription(sub);
			const plan: Tier =
				detectedTier ?? (profile.plan === 'studio' ? 'studio' : 'pro');
			if (!detectedTier) {
				console.error('reconcile: unknown tier for subscription, keeping profile plan', {
					user: profile.user_id,
					subscription: sub.id ?? null
				});
			}
			const { error: upErr } = await supabase
				.from('profiles')
				.update({
					plan,
					agentaos_subscription_id: sub.id,
					current_period_end: sub.currentPeriodEnd ?? profile.current_period_end,
					cancel_at_period_end: sub.cancelAtPeriodEnd === true,
					updated_at: now
				})
				.eq('user_id', profile.user_id);
			if (upErr) console.error('reconcile: update failed', profile.user_id, upErr);
			else updated.push(profile.user_id);
		} else {
			const { error: downErr } = await supabase
				.from('profiles')
				.update({
					plan: 'free',
					agentaos_subscription_id: null,
					current_period_end: null,
					cancel_at_period_end: false,
					updated_at: now
				})
				.eq('user_id', profile.user_id);
			if (downErr) console.error('reconcile: downgrade failed', profile.user_id, downErr);
			else downgraded.push(profile.user_id);
		}
	}

	console.log(`reconcile done: ${updated.length} renewed, ${downgraded.length} downgraded`);
	return new Response(JSON.stringify({ updated, downgraded }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
});
