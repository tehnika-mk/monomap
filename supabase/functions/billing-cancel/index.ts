import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AGENTAOS_API_KEY = Deno.env.get('AGENTAOS_API_KEY')!;
const AGENTAOS_API = 'https://api.agentaos.ai/api/v1';

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

	// Read the subscription id stored on the profile by the webhook. Use the
	// service role so RLS does not block the read (the anon client has no
	// user session of its own).
	const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
	const { data: profile } = await admin
		.from('profiles')
		.select('agentaos_subscription_id')
		.eq('user_id', data.user.id)
		.single();

	const subscriptionId = profile?.agentaos_subscription_id;
	if (!subscriptionId) {
		return new Response(JSON.stringify({ error: 'No active subscription' }), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	try {
		const res = await fetch(`${AGENTAOS_API}/gateway/subscriptions/${subscriptionId}/cancel`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': AGENTAOS_API_KEY
			},
			body: JSON.stringify({ atPeriodEnd: true })
		});
		const json = await res.json();
		if (!res.ok) {
			return new Response(
				JSON.stringify({ error: json.message ?? 'Could not cancel subscription' }),
				{ status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
			);
		}

		// Persist the pending cancellation so the UI stays correct across reloads.
		await admin
			.from('profiles')
			.update({
				cancel_at_period_end: true,
				current_period_end: json.currentPeriodEnd ?? null,
				updated_at: new Date().toISOString()
			})
			.eq('user_id', data.user.id);

		return new Response(JSON.stringify(json), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ error: err instanceof Error ? err.message : 'Cancellation failed' }),
			{ status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
		);
	}
});
