# Kyriq QB Stability — QA Runbook

## Pre-flight (both single-company and multi-company tenants)

### Extension OAuth flow
- [ ] Click "Connect QuickBooks" in extension sidepanel
- [ ] Intuit OAuth page opens in new tab
- [ ] Complete authorization in Intuit tab
- [ ] Extension detects completion automatically (tab auto-closes within ~2s)
- [ ] Sidepanel transitions to main view **without** manual "I've Connected" click
- [ ] If auto-close fails, "I've Connected — Refresh" button still works as fallback
- [ ] Company name appears in company dropdown

### Web app OAuth flow
- [ ] Settings → Integrations → Connect QuickBooks
- [ ] Redirected back to Settings with "Successfully connected to QuickBooks!" toast
- [ ] Toast **is dismissible** (click ✕)
- [ ] Connection status shows green "Connected"

### Data sync
- [ ] Extension: Sync button pulls QB transactions (Purchase+BillPayment+Check)
- [ ] Payroll checks (`Check` entity) appear in QB transaction list
- [ ] Web app QB Comparisons page → "Upload QB Data" pulls same data
- [ ] "Payroll Checks" filter option visible in QuickBooksFilters dropdown

### Multi-company switching
- [ ] Connect two QB companies for same tenant
- [ ] Extension dropdown shows both companies
- [ ] Switch to Company B → QB data auto-refreshes for Company B realm
- [ ] No stale Company A data shown after switch
- [ ] Web app QB Comparisons reflects the active company
- [ ] pull-checks.ts pulls from `qb_connections` active record, not stale `integrations`

### Token refresh
- [ ] Let token expire (or manually set `token_expires_at` to past)
- [ ] Extension Sync still works (refresh-token.ts proxies the refresh)
- [ ] Refreshed tokens saved to **both** `qb_connections` AND `integrations` tables

### Match / Review / Approve flow
- [ ] Extracted checks load and match against QB transactions
- [ ] Sort controls work: Date ↑↓, Amount ↑↓, Check # ↑↓, Score ↑↓
- [ ] Filter pills (All/Pending/Matched/Discrepancy/No Match/Done) update counts correctly
- [ ] Search and date-range filter work independently and together
- [ ] "Review" opens modal with extracted and QB data side-by-side
- [ ] Save Changes: extracted fields update in DB; QB push shows warning if QB API fails
- [ ] Approve & Clear: QB transaction marked cleared; check status saved to `checks` table
- [ ] If QB clear fails: **local-only approve** with amber warning banner (not a hard fail)
- [ ] Bulk Auto-Approve ≥95%: approves all high-confidence matches; reports local-only count

### Error states
- [ ] No QB connection → visible "Connect QuickBooks" prompt (not silent empty list)
- [ ] No active connection among multiple → extension auto-activates first available
- [ ] Token refresh fails (expired refresh token) → error message with "reconnect QB" prompt
- [ ] Network offline → non-blocking error messages, data still visible from cache

### Regression guard (single-company tenant)
- [ ] Connect one QB company
- [ ] Upload a cheque PDF → extracts correctly
- [ ] Run Sync → matches appear
- [ ] Approve one match → appears in History tab
- [ ] Refresh extension → approved check shows "Done" status (persisted in DB)
