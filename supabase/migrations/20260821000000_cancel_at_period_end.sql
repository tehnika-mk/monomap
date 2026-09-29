-- MonoMap — persist subscription cancellation state
-- Adds cancel_at_period_end so the UI can reflect a pending cancellation
-- across reloads (until the reconcile job downgrades the profile to free).

alter table public.profiles
	add column cancel_at_period_end boolean not null default false;