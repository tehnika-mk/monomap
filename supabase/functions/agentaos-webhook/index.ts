import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AGENTAOS_API_KEY = Deno.env.get('AGENTAOS_API_KEY')!;
const AGENTAOS_WEBHOOK_SECRET = Deno.env.get('AGENTAOS_WEBHOOK_SECRET')!;
const AGENTAOS_API = 'https://api.agentaos.ai/api/v1';

const PROVISIONAL_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days fallback

type Tier = 'pro' | 'studio';

// Map AgentaOS payment-link ids to the tier they sell, so grants work for
// direct payment-link purchases that carry no checkout metadata.
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

const HMAC_ALG = 'HMAC';

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
	const parts = Object.fromEntries(signature.split(',').map((p) => p.split('=') as [string, string]));
	const timestamp = Number(parts['t']);
	const v1 = parts['v1'];
	if (!timestamp || !v1) return false;
	if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false; // replay protection

	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const mac = await crypto.subtle.sign(HMAC_ALG, key, new TextEncoder().encode(`${timestamp}.${body}`));
	const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
	return expected === v1;
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

async function parkAtPeriodEnd(subscriptionId: string): Promise<void> {
	try {
		await fetch(`${AGENTAOS_API}/gateway/subscriptions/${subscriptionId}/cancel`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': AGENTAOS_API_KEY
			},
			body: JSON.stringify({ atPeriodEnd: true })
		});
	} catch (err) {
		console.error('parkAtPeriodEnd failed', subscriptionId, err);
	}
}

async function grantPlan(
	userId: string,
	userEmail: string,
	hintTier: Tier | null
): Promise<void> {
	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	let subscriptionId: string | null = null;
	let detectedTier: Tier | null = null;
	let currentPeriodEnd: string | null = new Date(Date.now() + PROVISIONAL_PERIOD_MS).toISOString();

	try {
		const subs = await listSubscriptions();
		const email = userEmail.toLowerCase();
		const active = subs.filter(
			(s: any) =>
				s.customerEmail?.toLowerCase() === email &&
				(s.status === 'active' || s.status === 'trialing')
		);

		// Prefer an open (not already cancelling) subscription matching the
		// requested tier; tolerate re-purchases while an old one is parked.
		const match =
			active.find((s: any) => tierForSubscription(s) === hintTier && s.cancelAtPeriodEnd !== true) ??
			active.find((s: any) => tierForSubscription(s) === hintTier) ??
			active.find((s: any) => s.cancelAtPeriodEnd !== true) ??
			active[0];

		if (match) {
			subscriptionId = match.id ?? null;
			detectedTier = tierForSubscription(match);
			currentPeriodEnd = match.currentPeriodEnd ?? currentPeriodEnd;

			for (const other of active) {
				if (
					other.id &&
					other.id !== subscriptionId &&
					other.cancelAtPeriodEnd !== true
				) {
					await parkAtPeriodEnd(other.id);
				}
			}
		}
	} catch {
		// provisional grant stands; the reconcile job will correct it
	}

	const plan: Tier = hintTier ?? detectedTier ?? 'pro';
	if (!hintTier && !detectedTier) {
		console.error('webhook: could not determine tier, defaulting to pro', { userId });
	}

	const { error } = await supabase.from('profiles').upsert(
		{
			user_id: userId,
			email: userEmail,
			plan,
			agentaos_subscription_id: subscriptionId,
			current_period_end: currentPeriodEnd,
			cancel_at_period_end: false,
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'user_id' }
	);
	if (error) throw error;
}

Deno.serve(async (req) => {
	const signature = req.headers.get('X-AgentaOS-Signature') ?? '';
	const body = await req.text();

	const valid = await verifySignature(body, signature, AGENTAOS_WEBHOOK_SECRET);
	if (!valid) {
		return new Response('Invalid signature', { status: 400 });
	}

	let event: any;
	try {
		event = JSON.parse(body);
	} catch {
		return new Response('Bad payload', { status: 400 });
	}

	if (event.type === 'checkout.session.completed') {
		const probe = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		let userId = event.data?.metadata?.userId as string | undefined;
		const rawTier = event.data?.metadata?.tier;
		const hintTier: Tier | null = rawTier === 'studio' || rawTier === 'pro' ? rawTier : null;

		// In-app checkouts attach metadata.userId. A checkout paid directly from
		// the AgentaOS payment link has no such metadata, so fall back to the
		// buyer email to find the matching profile.
		if (!userId) {
			let buyerEmail = '';
			try {
				const sessionId = event.data?.sessionId;
				if (sessionId) {
					const res = await fetch(`${AGENTAOS_API}/gateway/sessions/${sessionId}`, {
						headers: { 'x-api-key': AGENTAOS_API_KEY }
					});
					const checkout = await res.json();
					buyerEmail = checkout.buyerEmail ?? checkout.buyer_email ?? '';
				}
			} catch (err) {
				console.error('webhook: failed to fetch checkout', err);
			}

			if (buyerEmail) {
				const { data: profile } = await probe
					.from('profiles')
					.select('user_id')
					.ilike('email', buyerEmail)
					.maybeSingle();
				userId = profile?.user_id;
			}
		}

		if (!userId) {
			// No way to link this payment to an account yet (the user may not have
			// signed in before paying). The reconcile job grants by email later.
			return new Response('ok', { status: 200 });
		}

		const { data: profile } = await probe
			.from('profiles')
			.select('email')
			.eq('user_id', userId)
			.single();
		const userEmail = profile?.email ?? '';
		try {
			await grantPlan(userId, userEmail, hintTier);
		} catch (err) {
			console.error('grantPlan failed', err);
			return new Response('Webhook processing failed', { status: 500 });
		}
	}

	return new Response('ok', { status: 200 });
});
