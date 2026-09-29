-- MonoMap Studio tier: plan value, version history, share links, free-user presence.

-- ============================================================================
-- profiles.plan gains the 'studio' tier (superset of Pro entitlements).
-- ============================================================================
alter table public.profiles drop constraint profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check
	check (plan in ('free', 'pro', 'studio'));

-- ============================================================================
-- Entitlement gates. has_active_subscription now accepts both paid tiers;
-- has_studio additionally requires the studio plan.
-- ============================================================================
create or replace function public.has_active_subscription(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.profiles p
		where p.user_id = uid
		  and p.plan in ('pro', 'studio')
		  and (p.current_period_end is null or p.current_period_end > now())
	);
$$;

create or replace function public.has_studio(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.profiles p
		where p.user_id = uid
		  and p.plan = 'studio'
		  and (p.current_period_end is null or p.current_period_end > now())
	);
$$;

-- ============================================================================
-- user_map_versions: per-map snapshot history (Studio only). Snapshots are
-- written by the client during sync; the cap (25 per map) is pruned by the
-- client after each insert.
-- ============================================================================
create table public.user_map_versions (
	id text primary key,
	user_id uuid not null references auth.users (id) on delete cascade,
	map_id text not null,
	version int not null,
	node_count int not null default 0,
	map_data jsonb not null,
	created_at bigint not null,
	unique (user_id, map_id, version)
);

create index user_map_versions_user_map_idx
	on public.user_map_versions (user_id, map_id);

alter table public.user_map_versions enable row level security;

create policy "user_map_versions_select_own"
	on public.user_map_versions for select
	using (auth.uid() = user_id and public.has_studio(auth.uid()));

create policy "user_map_versions_insert_own"
	on public.user_map_versions for insert
	with check (auth.uid() = user_id and public.has_studio(auth.uid()));

create policy "user_map_versions_update_own"
	on public.user_map_versions for update
	using (auth.uid() = user_id and public.has_studio(auth.uid()));

create policy "user_map_versions_delete_own"
	on public.user_map_versions for delete
	using (auth.uid() = user_id and public.has_studio(auth.uid()));

-- ============================================================================
-- user_meta policies relaxed to owner-only. Meta carries workspace chrome
-- (folders, open tabs, mode) and now a device id for cross-device presence
-- detection; free users must be able to read/write their own row so the app
-- can tell them "your maps are on your other device". No map data here.
-- ============================================================================
drop policy "user_meta_select_own" on public.user_meta;
drop policy "user_meta_insert_own" on public.user_meta;
drop policy "user_meta_update_own" on public.user_meta;
drop policy "user_meta_delete_own" on public.user_meta;

create policy "user_meta_select_own"
	on public.user_meta for select
	using (auth.uid() = user_id);

create policy "user_meta_insert_own"
	on public.user_meta for insert
	with check (auth.uid() = user_id);

create policy "user_meta_update_own"
	on public.user_meta for update
	using (auth.uid() = user_id);

create policy "user_meta_delete_own"
	on public.user_meta for delete
	using (auth.uid() = user_id);

-- ============================================================================
-- shared_boards: token registry for read-only board share links. No client
-- policies at all — every access goes through the board-share Edge Function
-- using the service role, so tokens never bypass entitlement checks.
-- ============================================================================
create table public.shared_boards (
	token text primary key,
	owner_id uuid not null references auth.users (id) on delete cascade,
	board_id text not null,
	created_at timestamptz default now()
);

create unique index shared_boards_board_idx on public.shared_boards (board_id);
