-- MonoMap — schedule automatic subscription reconciliation.
--
-- Runs reconcile-subscriptions every 2 hours via pg_cron + pg_net so Pro grants
-- and downgrades always happen without manual invocation. Both the service-role
-- JWT and the project URL are read from Supabase Vault (secret names:
-- "reconcile-service-key" and "reconcile-url") so neither the raw secret nor the
-- hosted project ref lives in this SQL.
--
-- Required Vault secrets (set once per project):
--   reconcile-service-key : the service_role JWT
--   reconcile-url         : the project base URL, e.g. https://<project-ref>.supabase.co

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.reconcile_subscriptions_job()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	svc text;
	base text;
	url text;
begin
	select decrypted_secret into svc
	from vault.decrypted_secrets
	where name = 'reconcile-service-key'
	limit 1;

	if svc is null or svc = '' then
		raise notice 'reconcile-service-key missing in vault; skipping reconcile';
		return;
	end if;

	select decrypted_secret into base
	from vault.decrypted_secrets
	where name = 'reconcile-url'
	limit 1;

	if base is null or base = '' then
		raise notice 'reconcile-url missing in vault; skipping reconcile';
		return;
	end if;

	url := rtrim(base, '/') || '/functions/v1/reconcile-subscriptions';

	perform net.http_post(
		url := url,
		headers := jsonb_build_object(
			'Authorization', 'Bearer ' || svc,
			'Content-Type', 'application/json'
		),
		body := '{}',
		timeout_milliseconds := 30000
	);
end;
$$;

-- Schedule every 2 hours. Idempotent: remove any existing job first.
select cron.unschedule(jobid)
from cron.job
where command like '%reconcile_subscriptions_job()%';

select cron.schedule(
	'reconcile-subscriptions',
	'0 */2 * * *',
	'select public.reconcile_subscriptions_job();'
);