-- MonoMap cloud accounts + sync schema (v1.2)

-- ============================================================================
-- profiles: one row per account, carries the plan/entitlement state.
-- ============================================================================
create table public.profiles (
	user_id uuid primary key references auth.users (id) on delete cascade,
	email text not null,
	plan text not null default 'free' check (plan in ('free', 'pro')),
	agentaos_subscription_id text,
	current_period_end timestamptz,
	updated_at timestamptz default now()
);

-- Auto-create a profile row whenever an auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (user_id, email)
	values (new.id, new.email)
	on conflict (user_id) do nothing;
	return new;
end;
$$;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- ============================================================================
-- Entitlement gate: only an active Pro plan may touch cloud rows.
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
		  and p.plan = 'pro'
		  and (p.current_period_end is null or p.current_period_end > now())
	);
$$;

-- ============================================================================
-- user_meta: one row per user for workspace-wide state (folders, tabs, mode).
-- ============================================================================
create table public.user_meta (
	user_id uuid primary key references auth.users (id) on delete cascade,
	data jsonb not null,
	updated_at bigint not null
);

-- ============================================================================
-- user_maps: one row per mind map (per-map sync, LWW by updated_at).
-- ============================================================================
create table public.user_maps (
	id text primary key,
	user_id uuid not null references auth.users (id) on delete cascade,
	title text not null,
	folder_id text,
	created_at bigint not null,
	updated_at bigint not null,
	map_data jsonb not null,
	deleted_at bigint,
	unique (user_id, id)
);

-- ============================================================================
-- user_boards: one row per kanban board.
-- ============================================================================
create table public.user_boards (
	id text primary key,
	user_id uuid not null references auth.users (id) on delete cascade,
	title text not null,
	source_map_id text,
	created_at bigint not null,
	updated_at bigint not null,
	board_data jsonb not null,
	deleted_at bigint,
	unique (user_id, id)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.user_meta enable row level security;
alter table public.user_maps enable row level security;
alter table public.user_boards enable row level security;

-- profiles: users read only their own row. All plan grants/downgrades happen
-- server-side via the Edge Functions using the service role, which bypasses RLS
-- entirely, so there is deliberately no update/insert policy for the client.
create policy "profiles_select_own"
	on public.profiles for select
	using (auth.uid() = user_id);

-- Sync tables: only the owner, and only with an active subscription.
create policy "user_meta_select_own"
	on public.user_meta for select
	using (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_meta_insert_own"
	on public.user_meta for insert
	with check (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_meta_update_own"
	on public.user_meta for update
	using (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_meta_delete_own"
	on public.user_meta for delete
	using (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_maps_select_own"
	on public.user_maps for select
	using (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_maps_insert_own"
	on public.user_maps for insert
	with check (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_maps_update_own"
	on public.user_maps for update
	using (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_maps_delete_own"
	on public.user_maps for delete
	using (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_boards_select_own"
	on public.user_boards for select
	using (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_boards_insert_own"
	on public.user_boards for insert
	with check (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_boards_update_own"
	on public.user_boards for update
	using (auth.uid() = user_id and public.has_active_subscription(auth.uid()));

create policy "user_boards_delete_own"
	on public.user_boards for delete
	using (auth.uid() = user_id and public.has_active_subscription(auth.uid()));
