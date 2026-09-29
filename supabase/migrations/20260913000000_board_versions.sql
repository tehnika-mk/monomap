-- MonoMap Kanban board version history (Studio only). Mirrors user_map_versions:
-- snapshots are written by the client during sync, the cap (25 per board) is
-- pruned by the client after each insert.
create table public.user_board_versions (
	id text primary key,
	user_id uuid not null references auth.users (id) on delete cascade,
	board_id text not null,
	version int not null,
	card_count int not null default 0,
	board_data jsonb not null,
	created_at bigint not null,
	unique (user_id, board_id, version)
);

create index user_board_versions_user_board_idx
	on public.user_board_versions (user_id, board_id);

alter table public.user_board_versions enable row level security;

create policy "user_board_versions_select_own"
	on public.user_board_versions for select
	using (auth.uid() = user_id and public.has_studio(auth.uid()));

create policy "user_board_versions_insert_own"
	on public.user_board_versions for insert
	with check (auth.uid() = user_id and public.has_studio(auth.uid()));

create policy "user_board_versions_update_own"
	on public.user_board_versions for update
	using (auth.uid() = user_id and public.has_studio(auth.uid()));

create policy "user_board_versions_delete_own"
	on public.user_board_versions for delete
	using (auth.uid() = user_id and public.has_studio(auth.uid()));
