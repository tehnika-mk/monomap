import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	// Must include the headers supabase-js sends (apikey, x-client-info) or the
	// browser preflight fails and invoke() throws "Failed to send a request to
	// the Edge Function".
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

type Kind = 'board' | 'map';

interface KindConfig {
	shareTable: string;
	ownerTable: string;
	idColumn: string;
	dataColumn: string;
}

// A read-only share link can point at a kanban board or a mind map; the same
// token registry pattern and entitlement check applies to both.
const KINDS: Record<Kind, KindConfig> = {
	board: {
		shareTable: 'shared_boards',
		ownerTable: 'user_boards',
		idColumn: 'board_id',
		dataColumn: 'board_data'
	},
	map: {
		shareTable: 'shared_maps',
		ownerTable: 'user_maps',
		idColumn: 'map_id',
		dataColumn: 'map_data'
	}
};

function isKind(value: unknown): value is Kind {
	return value === 'board' || value === 'map';
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' }
	});
}

function notFound(): Response {
	return json({ error: 'Not found' }, 404);
}

function makeToken(): string {
	return crypto.randomUUID().replace(/-/g, '');
}

interface AuthedContext {
	userId: string;
	admin: ReturnType<typeof createClient>;
}

async function authenticate(req: Request): Promise<AuthedContext | null> {
	const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
	const authHeader = req.headers.get('Authorization') ?? '';
	const token = authHeader.replace('Bearer ', '');
	const { data, error } = await supabase.auth.getUser(token);
	if (error || !data.user) return null;
	return {
		userId: data.user.id,
		admin: createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
	};
}

async function hasStudio(admin: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
	const { data: profile } = await admin
		.from('profiles')
		.select('plan, current_period_end')
		.eq('user_id', userId)
		.single();
	if (!profile || profile.plan !== 'studio') return false;
	return (
		!profile.current_period_end || new Date(profile.current_period_end).getTime() > Date.now()
	);
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	let body: { action?: string; kind?: string; id?: string; token?: string } = {};
	try {
		body = await req.json();
	} catch {
		return json({ error: 'Bad request' }, 400);
	}

	// Public: resolve a share token to a read-only snapshot. The owner's Studio
	// entitlement is re-checked so links stop serving data after a lapse.
	if (body.action === 'resolve') {
		if (!body.token) return json({ error: 'Missing token' }, 400);
		const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
		for (const kind of ['board', 'map'] as Kind[]) {
			const cfg = KINDS[kind];
			const { data: share } = await admin
				.from(cfg.shareTable)
				.select(`owner_id, ${cfg.idColumn}`)
				.eq('token', body.token)
				.maybeSingle();
			if (!share) continue;

			const record = share as Record<string, unknown>;
			const ownerId = record.owner_id as string;
			if (!(await hasStudio(admin, ownerId))) return notFound();

			const entityId = record[cfg.idColumn] as string;
			const { data: entity } = await admin
				.from(cfg.ownerTable)
				.select(`title, ${cfg.dataColumn}, updated_at`)
				.eq('id', entityId)
				.eq('user_id', ownerId)
				.maybeSingle();
			if (!entity) return notFound();

			const row = entity as Record<string, unknown>;
			const data = row[cfg.dataColumn];
			if (!data) return notFound();

			return json({ kind, title: row.title, data, updatedAt: row.updated_at });
		}
		return notFound();
	}

	// Everything else requires an authenticated Studio owner.
	const ctx = await authenticate(req);
	if (!ctx) return json({ error: 'Not authenticated' }, 401);
	if (!(await hasStudio(ctx.admin, ctx.userId))) {
		return json({ error: 'Studio plan required' }, 403);
	}
	if (!isKind(body.kind)) return json({ error: 'Missing kind' }, 400);
	if (!body.id) return json({ error: 'Missing id' }, 400);

	const cfg = KINDS[body.kind];
	const { data: owner } = await ctx.admin
		.from(cfg.ownerTable)
		.select('id')
		.eq('id', body.id)
		.eq('user_id', ctx.userId)
		.maybeSingle();
	if (!owner) return json({ error: 'Not found' }, 404);

	if (body.action === 'get') {
		const { data: share } = await ctx.admin
			.from(cfg.shareTable)
			.select('token')
			.eq(cfg.idColumn, body.id)
			.maybeSingle();
		return json({ token: share?.token ?? null });
	}

	if (body.action === 'create') {
		await ctx.admin.from(cfg.shareTable).delete().eq(cfg.idColumn, body.id);
		const token = makeToken();
		const { error } = await ctx.admin
			.from(cfg.shareTable)
			.insert({ token, owner_id: ctx.userId, [cfg.idColumn]: body.id });
		if (error) return json({ error: error.message }, 500);
		return json({ token });
	}

	if (body.action === 'revoke') {
		const query = ctx.admin.from(cfg.shareTable).delete().eq('owner_id', ctx.userId);
		const { error } = body.token
			? await query.eq('token', body.token)
			: await query.eq(cfg.idColumn, body.id);
		if (error) return json({ error: error.message }, 500);
		return json({ ok: true });
	}

	return json({ error: 'Unknown action' }, 400);
});
