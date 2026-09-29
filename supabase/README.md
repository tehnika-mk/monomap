# Supabase — accounts, cloud sync & billing

This folder holds the Supabase schema and Edge Functions that power MonoMap accounts, Pro cloud sync,
and AgentaOS billing.

> **Quick path:** from the repo root, `npm run deploy:supabase` applies migrations and deploys every
> function (see [`../deploy/README.md`](../deploy/README.md)). The manual steps below are the same
> commands.

## Prerequisites

- `supabase` CLI installed: `npm i -g supabase` (or use `npx supabase`).
- Log in: `supabase login` (opens a browser flow).

## 1. Apply the schema (migrations)

```bash
supabase link --project-ref <project-ref>
supabase db push
```

The migration creates `profiles`, `user_meta`, `user_maps`, `user_boards`,
`user_map_versions`, `user_board_versions`, `shared_boards`, `shared_maps`, the
`has_active_subscription()` / `has_studio()` gates, and all RLS policies. `profiles` rows are auto-created on signup.

## 2. Deploy Edge Functions

```bash
supabase functions deploy create-checkout
supabase functions deploy agentaos-webhook
supabase functions deploy reconcile-subscriptions
supabase functions deploy billing-cancel
supabase functions deploy delete-account
supabase functions deploy share
```

Set the function secrets (Settings → Edge Functions → Secrets, or `supabase secrets set`):

| Secret                        | Value                                                             |
| ----------------------------- | ----------------------------------------------------------------- |
| `AGENTAOS_API_KEY`            | `sk_live_...` from the AgentaOS dashboard (live)                  |
| `AGENTAOS_WEBHOOK_SECRET`     | `whsec_...` from AgentaOS → Developer → Webhooks                  |
| `AGENTAOS_PRODUCT_ID`         | The Pro subscription payment-link UUID (`92011742-9cfc-4456-985a-b0d788ff5de9`) |
| `SUPABASE_SERVICE_ROLE_KEY`   | Dashboard → Settings → API → `service_role` (server-side only)    |

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically.

> **Live:** MonoMap is on live keys. `AGENTAOS_API_KEY` = the `sk_live_...` key and
> `AGENTAOS_WEBHOOK_SECRET` = the `whsec_...` from AgentaOS → Developer → Webhooks. Never commit or log
> either value.

## 3. Register the webhook

In the AgentaOS dashboard → **Developer → Webhooks**, set the endpoint to:

```
https://<project-ref>.supabase.co/functions/v1/agentaos-webhook
```

Copy the **signing secret** into `AGENTAOS_WEBHOOK_SECRET` above. The function verifies the
HMAC-SHA256 signature on every request before granting Pro. It links the payment to an account via
`metadata.userId` (in-app checkouts), and falls back to matching the profile by the buyer email when the
checkout was paid directly from the AgentaOS payment link. If no account exists yet, it returns 200 and
the `reconcile-subscriptions` job grants Pro by email once the user signs in.

## 4. Automatic reconciliation (every 2 hours)

`reconcile-subscriptions` re-checks AgentaOS subscriptions and renews/downgrades profiles (handles
cancellations and lapsed payments). It is **scheduled automatically every 2 hours** via `pg_cron` +
`pg_net` (migration `20260821010000_auto_reconcile.sql`): a security-definer Postgres function reads the
service-role key and the project URL from **Supabase Vault** (secret names `reconcile-service-key` and
`reconcile-url`) and POSTs to the Edge Function, so grants/downgrades happen with no manual step and
neither the secret nor the hosted ref lives in the SQL.

Set both Vault secrets once per project (Dashboard → Database → Vault, or SQL):

```sql
select vault.create_secret('<service-role-jwt>', 'reconcile-service-key');
select vault.create_secret('https://<project-ref>.supabase.co', 'reconcile-url');
```

You can still call the function manually:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/reconcile-subscriptions \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

## 5. Client environment

The app reads `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` from `.env`
(see the repo-root `.env.example`). The publishable key is safe for the client — RLS protects the data.

## 6. Email confirmation & password reset redirects

Account signup and password-reset emails point back to `/workspace` (same-origin, so no extra
`additional_redirect_urls` entry is needed). After clicking a confirmation or reset link the user lands in
the app, signed in; a password reset shows the "Set a new password" dialog directly.

## 7. Cancellation (at period end)

The **Account** window in the app offers **Cancel subscription**. It calls the `billing-cancel` Edge
Function, which posts `{ atPeriodEnd: true }` to AgentaOS — the subscriber keeps access until the end of
the current paid period (no refund). `billing-cancel` also sets `profiles.cancel_at_period_end = true` so
the app shows "Cancelled until <date>" even after a reload. The `reconcile-subscriptions` job keeps the
flag in sync with AgentaOS (cleared on renewal) and downgrades the profile to Free once the period ends.
Receipts and invoices are emailed to the buyer automatically by AgentaOS on every charge; there is no
customer-facing billing portal, so users view them via those emails.

## 7b. Account deletion

The **Account** window's **Danger zone** offers **Delete account** (the user types their email to
confirm). It calls the `delete-account` Edge Function, which:

1. Verifies the caller's JWT.
2. If the profile has an `agentaos_subscription_id`, cancels it **immediately**
   (`{ atPeriodEnd: false }`). If that call fails, it returns an error and **does not delete** the
   account, so a customer is never billed after deletion.
3. Deletes the auth user with the service role — every child row (`profiles`, `user_meta`, `user_maps`,
   `user_boards`, `user_map_versions`, `user_board_versions`, `shared_boards`, `shared_maps`) is removed via
   `on delete cascade`, so no extra migration is needed.

On success the client wipes the local IndexedDB workspace, deletion tombstones, and device markers, then
reloads to a fresh workspace.

## 7c. Share links (Studio)

The **share** Edge Function issues read-only links for boards **and** mind maps. The client sends
`{ action: 'get' | 'create' | 'revoke' | 'resolve', kind: 'board' | 'map', id, token? }`; the function
validates Studio entitlement, stores tokens in `shared_boards` / `shared_maps` (service role only, no
client policies), and returns `{ kind, title, data, updatedAt }` for `resolve`. The public page
`/share/[token]` renders the board or a static fit-to-view mind map.

> **CORS:** the function must return `Access-Control-Allow-Headers: authorization, x-client-info, apikey,
> content-type` on `OPTIONS`. supabase-js sends `apikey` and `x-client-info`; omitting them makes the
> browser preflight fail and `invoke()` throws "Failed to send a request to the Edge Function". After
> changing the function, redeploy it: `supabase functions deploy share`.

## 8. Live deployment & going live

- **Deploy the app**: `npm run build`, then copy `build/` to the site's document root. The live site must
  run the cloud-enabled build (the public/local-first build has no accounts UI).
- **nginx CSP**: the site's `Content-Security-Policy` `connect-src` must include the Supabase origin or
  every auth/sync request is blocked by the browser ("NetworkError when attempting to fetch resource"):

  ```
  https://<project-ref>.supabase.co wss://<project-ref>.supabase.co
  ```

  `deploy/nginx.conf.example` includes this; make sure the live vhost does too, then `nginx -s reload`.
- **Test → live**: MonoMap is **live** on `sk_live_*` keys (real charges). Ensure `AGENTAOS_API_KEY` and
  `AGENTAOS_WEBHOOK_SECRET` in the Edge Function secrets are the live values, then re-deploy the Edge
  Functions (`supabase functions deploy`). No application code change.

## Notes

- **Paywall is enforced server-side.** RLS policies on `user_maps`/`user_boards`/`user_meta` return rows
  only when `has_active_subscription(auth.uid())` is true, so a free or lapsed account can never read or
  write cloud data regardless of what the client does.
- **Client profile is read-only.** Users can only `select` their own profile; grants/downgrades go through
  the service role in the Edge Functions, so no one can self-upgrade.
