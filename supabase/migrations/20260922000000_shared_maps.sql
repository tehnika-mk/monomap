-- MonoMap map share links (Studio only). Mirrors shared_boards: there are no
-- client policies at all — every access goes through the `share` Edge Function
-- using the service role, so tokens never bypass entitlement checks.
create table public.shared_maps (
	token text primary key,
	owner_id uuid not null references auth.users (id) on delete cascade,
	map_id text not null,
	created_at timestamptz default now()
);

create unique index shared_maps_map_idx on public.shared_maps (map_id);
