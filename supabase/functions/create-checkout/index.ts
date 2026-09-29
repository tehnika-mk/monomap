import { createClient } from 'npm:@supabase/supabase-js@2';

const AGENTAOS_API = 'https://api.agentaos.ai/api/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const AGENTAOS_API_KEY = Deno.env.get('AGENTAOS_API_KEY')!;

// One AgentaOS payment link per tier/period/currency combination. The EUR
// monthly Pro link is the original AGENTAOS_PRODUCT_ID; the rest are optional
// secrets set with `supabase secrets set`. Missing links fall back to
// pro-monthly-EUR so checkout never breaks.
const PLAN_LINKS: Record<string, string | undefined> = {
	'pro-monthly-EUR': Deno.env.get('AGENTAOS_PRODUCT_ID'),
	'pro-annual-EUR': Deno.env.get('AGENTAOS_PRODUCT_ID_ANNUAL'),
	'pro-monthly-USD': Deno.env.get('AGENTAOS_PRODUCT_ID_USD'),
	'pro-annual-USD': Deno.env.get('AGENTAOS_PRODUCT_ID_ANNUAL_USD'),
	'studio-monthly-EUR': Deno.env.get('AGENTAOS_PRODUCT_ID_STUDIO'),
	'studio-annual-EUR': Deno.env.get('AGENTAOS_PRODUCT_ID_STUDIO_ANNUAL'),
	'studio-monthly-USD': Deno.env.get('AGENTAOS_PRODUCT_ID_STUDIO_USD'),
	'studio-annual-USD': Deno.env.get('AGENTAOS_PRODUCT_ID_STUDIO_ANNUAL_USD')
};

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	const authHeader = req.headers.get('Authorization') ?? '';
	const token = authHeader.replace('Bearer ', '');
	const { data, error } = await supabase.auth.getUser(token);
	if (error || !data.user) {
		return new Response(JSON.stringify({ error: 'Not authenticated' }), {
			status: 401,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	let body: { successUrl?: string; cancelUrl?: string; plan?: string; currency?: string; tier?: string } =
		{};
	try {
		body = await req.json();
	} catch {
		/* default to empty */
	}

	const tier = body.tier === 'studio' ? 'studio' : 'pro';
	const plan = body.plan === 'monthly' ? 'monthly' : 'annual';
	const currency = body.currency === 'USD' ? 'USD' : 'EUR';
	const linkId = PLAN_LINKS[`${tier}-${plan}-${currency}`] ?? PLAN_LINKS['pro-monthly-EUR'];
	if (!linkId) {
		return new Response(JSON.stringify({ error: 'Checkout is not configured yet' }), {
			status: 503,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	const payload = {
		linkId,
		buyerEmail: data.user.email ?? undefined,
		successUrl: body.successUrl ?? `https://monomap.app/workspace`,
		cancelUrl: body.cancelUrl ?? `https://monomap.app/workspace`,
		metadata: { userId: data.user.id, tier }
	};

	try {
		const res = await fetch(`${AGENTAOS_API}/gateway/sessions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': AGENTAOS_API_KEY
			},
			body: JSON.stringify(payload)
		});
		const json = await res.json();
		if (!res.ok || !json.checkoutUrl) {
			return new Response(
				JSON.stringify({ error: json.message ?? 'Could not create checkout' }),
				{ status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}
		return new Response(JSON.stringify({ checkoutUrl: json.checkoutUrl }), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Checkout failed' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
});
