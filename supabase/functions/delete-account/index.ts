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

function json(body: unknown, status: number): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' }
	});
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
	const { data, error } = await supabase.auth.getUser(token);
	if (error || !data.user) {
		return json({ error: 'Not authenticated' }, 401);
	}

	const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	// Cancel an active subscription *first* (immediately). If that fails we keep
	// the account so the customer is never charged for a deleted account.
	const { data: profile } = await admin
		.from('profiles')
		.select('agentaos_subscription_id')
		.eq('user_id', data.user.id)
		.single();

	const subscriptionId = profile?.agentaos_subscription_id;
	if (subscriptionId) {
		try {
			const res = await fetch(`${AGENTAOS_API}/gateway/subscriptions/${subscriptionId}/cancel`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': AGENTAOS_API_KEY
				},
				body: JSON.stringify({ atPeriodEnd: false })
			});
			if (!res.ok) {
				let message = 'Could not cancel the active subscription';
				try {
					const body = await res.json();
					if (body?.message) message = body.message;
				} catch {
					/* keep the generic message */
				}
				return json({ error: `${message}. Your account was not deleted.` }, 400);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Cancellation failed';
			return json({ error: `${message}. Your account was not deleted.` }, 400);
		}
	}

	// Child rows (profiles, user_meta, maps, boards, versions, shared_boards)
	// are removed automatically via `on delete cascade`.
	const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
	if (deleteError) {
		return json({ error: deleteError.message }, 500);
	}

	return json({ ok: true }, 200);
});
