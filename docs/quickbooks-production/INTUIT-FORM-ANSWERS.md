# Intuit production form: the answers

Every value below was read out of the code on 14 October 2026. The older files in this folder were
corrected to the same host and name on 19 October 2026, but **this file stays the authoritative
list for the Intuit form**, and `CUTOVER.md` is the runbook for the key switch itself.

Also ignore `docs/INTUIT-URLS-REFERENCE.md`, `docs/DEPLOYMENT-GUIDE.md` and
`docs/RAILWAY-DEPLOYMENT-FIX.md`. They put the OAuth callback on a Railway URL. It is a Next.js API
route on Vercel.

---

## URLs

| Intuit field | Value |
|---|---|
| Host domain | `kyriq.com` |
| Launch URL | `https://kyriq.com/settings?tab=integrations` |
| Connect URL | `https://kyriq.com/api/qbo/auth` |
| Reconnect URL | `https://kyriq.com/api/qbo/auth` |
| Disconnect URL | `https://kyriq.com/api/qbo/disconnect` |
| Redirect URI | `https://kyriq.com/api/qbo/callback` |
| EULA | `https://kyriq.com/legal/eula` |
| Privacy policy | `https://kyriq.com/privacy` |
| Terms of service | `https://kyriq.com/terms` |

Give Intuit `/privacy` and `/terms`, **not** `/privacy` and `/terms`. Those two are now
307 redirect stubs, and some reviewers reject a redirect. The EULA is the exception: it exists only
under `/legal`.

Connect and Reconnect are the same endpoint on purpose. `disconnect.ts` preserves the client id,
secret and redirect URI precisely so a reconnect does not need re-provisioning.

**Redirect URIs to whitelist:** `https://kyriq.com/api/qbo/callback`, plus
`http://localhost:3080/api/qbo/callback` if local development should keep working. The Chrome
extension does **not** need its own entry — it calls `/api/qbo/auth?source=extension` and uses the
same redirect; `source=extension` only changes where the user lands afterwards.

---

## Scope

`com.intuit.quickbooks.accounting` — this one only.

---

## What the app reads and writes

Declare this honestly. It is a read **and** write integration against transaction records.

**Reads.** Purchase (PaymentType = Check), BillPayment, Check, Payment, Deposit, Account,
CompanyInfo. All at `minorversion=73`.

**Writes.** Creates Purchase (cheque written) and Deposit (cheque received). Sparse-updates Purchase,
Payment, Deposit, BillPayment and Check — amount, date, DocNumber and PrivateNote only. Clearing
stamps a `[Kyriq]` audit block into PrivateNote, because the cleared flag cannot be set through the
API; BillPayment returns a "mark it manually" warning for the same reason.

No Attachable writes. `upload-file.ts` parses `.qbo/.ofx/.qfx` locally and never calls Intuit.

**One thing to tidy before submitting.** The diagnostic screens `preview.ts` and `explore.ts` read
thirteen entity types, including Vendor, Customer, Invoice, Bill, Transfer, JournalEntry and Item.
The product does not need them. Intuit asks about data minimisation, and reading far more than you
use invites a follow-up question. Either narrow those two routes or be ready to explain them as
admin-only diagnostics.

---

## Hosting

| | |
|---|---|
| Frontend | Vercel, serverless |
| Backend | Railway, Python FastAPI |
| Database and file storage | Supabase (Postgres and Storage) |
| OCR | Google Gemini API |

**Static outbound IP: none.** Neither Vercel Functions nor default Railway give a fixed egress
address. The form says you may continue without one, so leave it blank rather than inventing a value.

**Country: you have to read this off the dashboards.** Nothing in the repo pins a Vercel or Railway
region, so it cannot be answered from code.

---

## App name

The Intuit app is still called "OCR EXTRACTOR". Rename it to **Kyriq**. That string appears nowhere
in the codebase, so it is purely a dashboard edit.

Some backend banners still say "Check Extractor API" (`backend/api_server.py`), and the CORS regex
still allows the legacy `cheque-extractor` and `check-extractor` Vercel hosts. Neither is
QuickBooks-facing, so neither blocks submission, but both are worth cleaning up.

---

## Before you submit

Three OAuth faults were fixed on 14 October (commit `0dd054d`) precisely because a reviewer runs a
live connect:

- `auth.ts` and `callback.ts` resolved the client id in opposite order, so a stale database row broke
  the exchange *after* the user consented.
- The Disconnect URL answered 405. Intuit sends the user there as a browser GET; it now redirects to
  Settings with an explanation and does not revoke on GET.
- `/qb-oauth-complete` was not in the public route allowlist, so the extension's post-OAuth tab
  bounced to the login page.

**These are only live once production deploys them.** kyriq.com currently builds from
`iTaxhub/check-extractor`, which is a separate repository from the one the work lands in. Confirm
the fixes are actually on kyriq.com before submitting, or the reviewer will hit all three.

**Also rotate** the development Client ID and secret, which were pasted into a chat on 14 October,
and remove the development Client ID committed in plaintext in `MASTER-CHECKLIST.md`.

**Watch the read quota.** Intuit's free tier allows 500,000 data-out reads per month and **blocks**
rather than bills when exceeded, which would stop every customer's sync at once.
