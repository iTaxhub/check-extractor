# QuickBooks Online: development keys → production keys

One-page runbook. Every statement below was checked against the code on 19 October 2026.
Form values (host domain, URLs, descriptions) live in `INTUIT-FORM-ANSWERS.md`.

## 1. What changes and where it lives

| Variable | Read by | Set in |
|---|---|---|
| `QUICKBOOKS_CLIENT_ID` | `frontend/pages/api/qbo/auth.ts`, `callback.ts`, `frontend/lib/qb-token.ts` | Vercel |
| `QUICKBOOKS_CLIENT_SECRET` | `callback.ts`, `qb-token.ts` (token refresh) | Vercel |
| `QUICKBOOKS_REDIRECT_URI` | `auth.ts`, `callback.ts` | Vercel |
| `NEXT_PUBLIC_APP_URL` | fallback base for the redirect URI (`https://kyriq.com`) | Vercel |
| `QBO_STATE_SECRET` | `frontend/lib/qbo-state.ts` signs the OAuth `state` (falls back to the service-role key) | Vercel |
| `INTUIT_CLIENT_ID` / `INTUIT_CLIENT_SECRET` / `INTUIT_REDIRECT_URI` | `backend/api_server.py` (also accepts the `QUICKBOOKS_*` names) | Railway |

Production values go into the Vercel and Railway dashboards only. Never into git, `.env` files in
the repo, or a Supabase row.

**Resolution order is env var first, then the tenant's `integrations` row, then the default**, and it
is identical in `auth.ts`, `callback.ts` and `qb-token.ts` (`frontend/scripts/check-qb-switchers.ts`
asserts this). A leftover sandbox `qb_client_id` in `integrations` therefore cannot override the
production env var at connect or at refresh. Clear such rows anyway so nobody is misled (§5).

**Redirect URI** is `https://kyriq.com/api/qbo/callback`. It comes from the env var or the
`NEXT_PUBLIC_APP_URL` default, never from the request host. Whitelist exactly that on the Production
tab (plus `http://localhost:3080/api/qbo/callback` on Development if local work should keep working).

**Chrome extension** needs no redirect URI of its own. It asks the backend for the auth URL
(`/api/qbo/auth?source=extension`, see `chrome-extension/background/service-worker.js`) and the user
lands on the same `kyriq.com` callback. It does not use `chrome.identity`.

**Scope** requested is `com.intuit.quickbooks.accounting` only (`auth.ts`). Do not tick payments,
payroll or OpenID on the Intuit side.

## 2. Sandbox: leave `QB_SANDBOX` unset on production keys

Only four routes switch host on `QB_SANDBOX=true`: `qbo/update-transaction.ts`, `qbo/create-check.ts`,
`qbo/clear-transaction.ts`, `debug/qb-clear.ts`. Nine other API routes (`pull-checks`, `accounts`,
`company-info`, `health-check`, `diagnose`, `explore`, `preview`, `matches/sync-qb`,
`matches/create-in-qb`) and the extension hardcode `quickbooks.api.intuit.com`. With production keys a
sandbox company therefore only half-works: reads fail while a few writes point at sandbox. Keep
`QB_SANDBOX` unset and test against a real company.

## 3. Intuit side (you, signed in at https://developer.intuit.com)

The portal is the authoritative form; the list below is the order it asks for things.

1. **Keys & OAuth → Production tab.** Copy the production Client ID and Client Secret into Vercel
   and Railway as per §1. Add the redirect URI from §1.
2. **App profile (production).** Host domain `kyriq.com`, launch URL
   `https://kyriq.com/settings?tab=integrations`, disconnect URL `https://kyriq.com/api/qbo/disconnect`,
   privacy `https://kyriq.com/privacy`, terms `https://kyriq.com/terms`, EULA
   `https://kyriq.com/legal/eula`, support email, app name Kyriq. Exact text: `INTUIT-FORM-ANSWERS.md`.
3. **App assessment questionnaire.** Required before production keys are issued, even for an app that
   will never be listed. Answers: `COMPLIANCE-STATEMENTS.md`, `APP-DESCRIPTIONS.md`.
4. **Wait.** Intuit publishes no SLA. Third-party reports range from a couple of days to several
   weeks, longer if the questionnaire bounces. Plan client communication around weeks.

## 4. Cutover sequence

1. Production keys issued (§3). Nothing else first.
2. Set the variables in Vercel and Railway (§1). Redeploy both.
3. Tell affected users to reconnect (§5). Every existing token was minted under the development
   client; there is no `environment` column in `qb_connections` or `integrations`, so the app cannot
   tell old from new rows. The first refresh with the new secret fails and the UI shows
   **Reconnect QuickBooks** (PR #26 path, `frontend/lib/qb-health.ts` classifies the dead refresh
   token). One click through `/api/qbo/auth` fixes it; `disconnect.ts` keeps the credential columns
   so no re-provisioning is needed.
4. Verify with one real company: connect, `GET /api/qbo/company-info`, `pull-checks`, one
   `update-transaction`. Check Vercel logs for `invalid_client` (wrong secret) or
   `redirect_uri_mismatch` (whitelist typo).

## 5. SQL: who is affected

Run in the Supabase SQL editor (service role) before step 3 to know whom to notify.

```sql
-- Tenants holding a QuickBooks token in either store
select t.id as tenant_id, t.name, 'qb_connections' as store, c.realm_id, c.company_name,
       c.is_active, c.status, c.token_expires_at as expires_at
from qb_connections c join tenants t on t.id = c.tenant_id
union all
select t.id, t.name, 'integrations', i.realm_id, i.company_name,
       null, null, i.expires_at
from integrations i join tenants t on t.id = i.tenant_id
where i.provider = 'quickbooks' and i.access_token is not null
order by tenant_id, store;

-- Rows carrying their own (sandbox-era) client id or redirect URI. Env wins over them,
-- but clear them so the Settings page does not show stale values.
select tenant_id, realm_id, qb_client_id is not null as has_client_id,
       qb_client_secret is not null as has_secret, qb_redirect_uri
from integrations
where provider = 'quickbooks'
  and (qb_client_id is not null or qb_client_secret is not null or qb_redirect_uri is not null);
-- To clear:  update integrations set qb_client_id = null, qb_client_secret = null,
--            qb_redirect_uri = null where provider = 'quickbooks';
```

## 6. Rollback

Put the development Client ID and Secret back in Vercel and Railway and redeploy. Tokens issued under
the production keys then fail the same way, so users reconnect again. There is no data migration to
undo.
