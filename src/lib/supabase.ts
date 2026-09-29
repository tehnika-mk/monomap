import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// A placeholder/empty config means the build was made without real Supabase
// credentials. Auth/sync would fail with an opaque "NetworkError" in the
// browser, so surface it clearly instead.
export const supabaseConfigured =
	!!PUBLIC_SUPABASE_URL &&
	!!PUBLIC_SUPABASE_ANON_KEY &&
	!PUBLIC_SUPABASE_URL.includes('example.supabase.co') &&
	!PUBLIC_SUPABASE_ANON_KEY.includes('REPLACE_WITH');

if (!supabaseConfigured) {
	console.error(
		'[supabase] Missing/placeholder PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY. ' +
			'Copy .env.example to .env and fill in the values from Supabase → Project Settings → API, then rebuild.'
	);
}

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export type AppUser = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	country: string;
};

// Names and country live in Supabase Auth `user_metadata`, so no schema change
// or RLS change is needed and they come back with every session.
function metaString(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

export function toAppUser(user: {
	id: string;
	email?: string | null;
	user_metadata?: Record<string, unknown> | null;
}): AppUser {
	const meta = user.user_metadata ?? {};
	return {
		id: user.id,
		email: user.email ?? '',
		firstName: metaString(meta.first_name),
		lastName: metaString(meta.last_name),
		country: metaString(meta.country)
	};
}

export type PlanId = 'free' | 'pro' | 'studio';

export type PaidTier = Exclude<PlanId, 'free'>;

export interface Profile {
	user_id: string;
	email: string;
	first_name: string;
	last_name: string;
	country: string;
	plan: PlanId;
	agentaos_subscription_id: string | null;
	current_period_end: string | null;
	cancel_at_period_end: boolean;
	updated_at: string;
}

const periodActive = (profile: Profile): boolean =>
	profile.current_period_end === null ||
	new Date(profile.current_period_end).getTime() > Date.now();

export const isPro = (profile: Profile | null): boolean =>
	!!profile && (profile.plan === 'pro' || profile.plan === 'studio') && periodActive(profile);

export const isStudio = (profile: Profile | null): boolean =>
	!!profile && profile.plan === 'studio' && periodActive(profile);
