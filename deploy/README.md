# Deploying MonoMap

Two independent targets:

| Target | What | Where it runs | Command |
| ------ | ---- | ------------- | ------- |
| Static app | `build/` (SvelteKit, `adapter-static`) | your nginx host (`/home/monomap/htdocs/monomap.app`) | `npm run build` + upload |
| Supabase | DB migrations + Edge Functions | hosted project `<project-ref>` | `npm run deploy:supabase` |

The app calls the functions over HTTPS at
`https://<project-ref>.supabase.co/functions/v1/<name>`, so **app and functions must ship
together** — deploying one without the other can break share links / version history.

## One-time setup

The npm scripts use `npx supabase@<pinned>`; no global install is required (the CLI is downloaded on
first use). Log in once so the CLI has an access token:

```powershell
npm run supabase:login        # opens a browser flow; stores the token in ~/.supabase
```

For non-interactive/CI use, set env vars instead of logging in:

- `SUPABASE_PROJECT_REF` — your hosted project ref (Dashboard → Settings → General). The
  `deploy:*` scripts read it from `.env` or the environment; it is intentionally **not** committed.
- `SUPABASE_ACCESS_TOKEN` — personal access token (Supabase → Account → Access Tokens)
- `SUPABASE_DB_PASSWORD` — project database password (only needed by `deploy:db`)

Add it to the gitignored `.env`:

```dotenv
SUPABASE_PROJECT_REF=your-project-ref
```

Function secrets (Settings → Edge Functions → Secrets, or `supabase secrets set`). `SUPABASE_URL` and
`SUPABASE_ANON_KEY` are injected automatically; set the rest:

- `SUPABASE_SERVICE_ROLE_KEY`
- `AGENTAOS_API_KEY`, `AGENTAOS_WEBHOOK_SECRET`
- `AGENTAOS_PRODUCT_ID`, `AGENTAOS_PRODUCT_ID_ANNUAL`, `AGENTAOS_PRODUCT_ID_USD`,
  `AGENTAOS_PRODUCT_ID_ANNUAL_USD`
- `AGENTAOS_PRODUCT_ID_STUDIO`, `AGENTAOS_PRODUCT_ID_STUDIO_ANNUAL`, `AGENTAOS_PRODUCT_ID_STUDIO_USD`,
  `AGENTAOS_PRODUCT_ID_STUDIO_ANNUAL_USD`

## Deploy

```powershell
# 1. Database migrations (profiles, sync tables, versions, share tables, gates, RLS)
npm run deploy:db            # = supabase db push --project-ref <project-ref>

# 2. Edge Functions (all of supabase/functions/)
npm run deploy:functions     # = supabase functions deploy --project-ref <project-ref> --use-api

# 3. App
npm run build                # clean build → build/
# then upload the contents of build/ to the nginx document root

# or both Supabase steps at once:
npm run deploy:supabase
```

`--use-api` bundles functions server-side, so Docker is not required.

### Deploy a single function

```powershell
npx supabase@2.117.0 functions deploy share --project-ref <project-ref> --use-api
```

### First-time link (only needed for local dev / `db diff`)

```powershell
npx supabase@2.117.0 link --project-ref <project-ref>
```

## Verify

```powershell
# share preflight must list apikey + x-client-info (CORS fix)
curl.exe -s -X OPTIONS "https://<project-ref>.supabase.co/functions/v1/share" `
  -H "Origin: https://monomap.app" -H "Access-Control-Request-Headers: apikey,x-client-info" -i | findstr /i access-control-allow-headers

# delete-account should no longer be 404
curl.exe -s -o NUL -w "%{http_code}\n" -X OPTIONS "https://<project-ref>.supabase.co/functions/v1/delete-account"
```

## Notes & cautions

- **Redeploy functions after any change** under `supabase/functions/**`; the running function does not
  auto-update from the repo.
- **`agentaos-webhook` must skip JWT verification** (AgentaOS calls it server-to-server with no Supabase
  JWT). `supabase/config.toml` pins `[functions.agentaos-webhook] verify_jwt = false`, so a blanket
  `deploy:functions` is safe — do not remove that block.
- **HTML is served prerendered** via nginx `try_files $uri $uri.html $uri/ /200.html`; after a build the
  browser may hold fingerprinted assets, so a hard refresh can be needed once.
- The old `board-share` function is superseded by `share`; remove it if you like:
  `npx supabase@2.117.0 functions delete board-share`.
