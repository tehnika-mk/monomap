-- MonoMap — persist signup name/country in public.profiles.
--
-- Names and country live in auth.users.raw_user_meta_data (set by signUp's
-- options.data). Copy them into profiles so the row is self-describing and
-- visible in the Supabase Table Editor, and keep it in sync when the user
-- edits their profile in the app (supabase.auth.updateUser).

alter table public.profiles
	add column first_name text not null default '',
	add column last_name text not null default '',
	add column country text not null default '';

-- Copy the metadata fields on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (user_id, email, first_name, last_name, country)
	values (
		new.id,
		new.email,
		coalesce(new.raw_user_meta_data ->> 'first_name', ''),
		coalesce(new.raw_user_meta_data ->> 'last_name', ''),
		coalesce(new.raw_user_meta_data ->> 'country', '')
	)
	on conflict (user_id) do nothing;
	return new;
end;
$$;

-- Recreate the signup trigger idempotently (repairs a missing trigger too).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- Keep profiles in sync when the user edits name/country or changes email.
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	update public.profiles
	set first_name = coalesce(new.raw_user_meta_data ->> 'first_name', ''),
		last_name = coalesce(new.raw_user_meta_data ->> 'last_name', ''),
		country = coalesce(new.raw_user_meta_data ->> 'country', ''),
		email = new.email,
		updated_at = now()
	where user_id = new.id;
	return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
	after update of raw_user_meta_data, email on auth.users
	for each row execute function public.handle_user_updated();

-- Backfill existing rows from auth metadata.
update public.profiles p
set first_name = coalesce(u.raw_user_meta_data ->> 'first_name', ''),
	last_name = coalesce(u.raw_user_meta_data ->> 'last_name', ''),
	country = coalesce(u.raw_user_meta_data ->> 'country', '')
from auth.users u
where u.id = p.user_id
	and (p.first_name = '' or p.last_name = '' or p.country = '');
