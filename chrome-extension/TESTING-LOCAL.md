# Kyriq Chrome Extension — Local Testing Guide

Complete guide for testing the Kyriq extension locally before production deployment.

---

## 🚀 Quick Start (5 Minutes)

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to and select: `C:\Users\inkno\Documents\GitHub\cheque-extractor\chrome-extension`
5. The Kyriq extension should now appear in your extensions list

**Expected Result:** ✅ Kyriq icon appears in Chrome toolbar

---

### 2. Extension Configuration

**Configuration is automatic** — The extension fetches all required credentials from your backend server:
- Supabase URL & Anon Key
- QuickBooks Client ID & Secret  
- Gemini API Key

These are configured once in your backend environment variables and shared across all users.

**No manual setup required!** Users only need to login with their account credentials.

**For Developers/Admins:**
If you need to update backend configuration, set these environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `QB_CLIENT_ID`
- `QB_CLIENT_SECRET`
- `GEMINI_API_KEY`

**Expected Result:** ✅ Extension auto-configures on first launch

---

## 🧪 Comprehensive Testing Checklist

### Phase 1: Authentication & Setup (5 min)

#### Test 1.1: Login Flow
- [ ] Click Kyriq extension icon
- [ ] Enter email and password
- [ ] Click **Log In**
- [ ] **Expected:** Redirects to main view with company selector
- [ ] **Expected:** No error messages

#### Test 1.2: Session Persistence
- [ ] Close popup
- [ ] Reopen popup
- [ ] **Expected:** Still logged in (no login screen)

#### Test 1.3: Logout
- [ ] Click ⚙️ Settings
- [ ] Click **Log Out**
- [ ] **Expected:** Returns to login screen
- [ ] **Expected:** Session cleared

---

### Phase 2: QuickBooks Integration (10 min)

#### Test 2.1: Company Connections
- [ ] Login to extension
- [ ] Check company dropdown
- [ ] **Expected:** Shows connected QB companies
- [ ] **Expected:** Active company is pre-selected

#### Test 2.2: Company Switching
- [ ] Select different company from dropdown
- [ ] **Expected:** "Switching company..." loading message
- [ ] **Expected:** Company switches successfully
- [ ] **Expected:** Match list updates/clears

#### Test 2.3: QB Transaction Sync
- [ ] Click **🔄 Sync** button
- [ ] **Expected:** "Syncing QB transactions..." loading message
- [ ] **Expected:** Success message with transaction count
- [ ] **Check Console:** `F12` → Console → Look for sync logs

**Verify in Supabase:**
1. Go to Supabase Dashboard → Table Editor → `qb_transactions`
2. Filter by your `tenant_id`
3. **Expected:** Recent transactions from last 30 days

---

### Phase 3: Check Upload & OCR (15 min)

#### Test 3.1: Single Check Upload
- [ ] Switch to **Upload** tab
- [ ] Click upload zone or drag a check image
- [ ] **Expected:** "🚀 Extracting 1 check(s)..." message
- [ ] **Expected:** Extracted check data appears below

**Verify Extraction Quality:**
- [ ] Check number extracted correctly
- [ ] Amount extracted correctly
- [ ] Date extracted correctly
- [ ] Payee name extracted correctly

#### Test 3.2: Multiple Check Upload
- [ ] Upload 3-5 check images at once
- [ ] **Expected:** Parallel extraction progress
- [ ] **Expected:** All checks extracted and listed

#### Test 3.3: Error Handling
- [ ] Try uploading a non-image file (e.g., .txt)
- [ ] **Expected:** Graceful error or skip

---

### Phase 4: Matching Algorithm (10 min)

#### Test 4.1: Run Matching
- [ ] After uploading checks, click **🔍 Match Against QB**
- [ ] **Expected:** "Matching against QB..." loading
- [ ] **Expected:** Switches to Matches tab
- [ ] **Expected:** Match results appear with scores

#### Test 4.2: Match Quality Verification
For each match, verify:
- [ ] **Score** is calculated (0-100%)
- [ ] **Status** is assigned (matched/pending/discrepancy/unmatched)
- [ ] **Amount** comparison is correct
- [ ] **Check number** comparison is correct

#### Test 4.3: Match Detail Expansion
- [ ] Click on a match row
- [ ] **Expected:** Detail section expands
- [ ] **Expected:** Score breakdown shows (Amount/Check#/Date/Payee)
- [ ] **Expected:** Visual bars represent scores

---

### Phase 5: Approve & Clear (10 min)

#### Test 5.1: Single Approval
- [ ] Find a high-confidence match (≥90%)
- [ ] Click **✅ Approve & Clear**
- [ ] **Expected:** "Approving & clearing in QB..." loading
- [ ] **Expected:** Status changes to "approved"
- [ ] **Expected:** Row color changes to blue

**Verify in QuickBooks:**
1. Login to QuickBooks Online
2. Navigate to transaction (Purchase/Check/BillPayment)
3. Open transaction details
4. Check **Private Note** field
5. **Expected:** Contains `[Kyriq] Verified & Cleared [date]`

#### Test 5.2: Bulk Auto-Approve
- [ ] Click **✅ Auto-Approve ≥95%** button
- [ ] **Expected:** Confirmation alert with count
- [ ] **Expected:** All matches ≥95% change to "approved"

#### Test 5.3: Undo Approval
- [ ] Click **↩️ Undo** on an approved match
- [ ] **Expected:** Status reverts to matched/pending

---

### Phase 6: Filtering & Search (5 min)

#### Test 6.1: Status Filters
Test each filter pill:
- [ ] **All** — shows all matches
- [ ] **Pending** — shows only pending
- [ ] **Matched** — shows only matched
- [ ] **Disc.** — shows only discrepancies
- [ ] **No Match** — shows unmatched
- [ ] **Done** — shows approved

**Expected:** Counts update correctly

#### Test 6.2: Manual Search (for unmatched)
- [ ] Find an unmatched check
- [ ] Click **🔍 Find**
- [ ] Enter search query (payee name)
- [ ] **Expected:** QB search results appear
- [ ] **Expected:** Can select a transaction

---

### Phase 7: QuickBooks Online Overlay (10 min)

#### Test 7.1: Overlay Injection
- [ ] Open QuickBooks Online in a new tab
- [ ] Login to QBO
- [ ] Navigate to any page (Dashboard/Banking/Reports)
- [ ] **Expected:** Green **K** floating button appears (bottom-right)

#### Test 7.2: Panel Functionality
- [ ] Click the **K** button
- [ ] **Expected:** Kyriq panel slides in
- [ ] **Expected:** Shows company name
- [ ] **Expected:** Shows connection count
- [ ] Click **×** to close
- [ ] **Expected:** Panel closes

#### Test 7.3: SPA Navigation
- [ ] With panel open, navigate to different QBO pages
- [ ] **Expected:** FAB button persists
- [ ] **Expected:** Panel updates if open

**Check Console:**
- [ ] Open DevTools (`F12`)
- [ ] Look for `[Kyriq] Content script loaded`
- [ ] Look for `[Kyriq] Active on QBO page`

---

### Phase 8: Badge & Notifications (5 min)

#### Test 8.1: Extension Badge
- [ ] Create some pending/unmatched matches
- [ ] Wait 5 minutes (badge updates every 5 min)
- [ ] **Expected:** Badge count appears on extension icon
- [ ] **Expected:** Shows count of pending items

#### Test 8.2: Badge Clearing
- [ ] Approve all pending matches
- [ ] Wait 5 minutes
- [ ] **Expected:** Badge disappears

---

## 🐛 Debugging & Troubleshooting

### View Extension Logs

**Background Service Worker:**
1. Go to `chrome://extensions/`
2. Find Kyriq extension
3. Click **service worker** link (under "Inspect views")
4. Console opens with background logs

**Popup Logs:**
1. Right-click extension icon → **Inspect popup**
2. Console shows popup logs

**Content Script Logs:**
1. On QuickBooks Online page, press `F12`
2. Console shows content script logs
3. Look for `[Kyriq]` prefixed messages

### Common Issues

#### Issue: "Supabase URL not configured"
- **Fix:** Go to Settings and enter Supabase URL

#### Issue: "No active QB connection"
- **Fix:** Connect QuickBooks via main web app first
- **Fix:** Ensure `qb_connections` table has `is_active=true` row

#### Issue: "Token refresh failed"
- **Fix:** QB credentials expired, reconnect via web app
- **Fix:** Verify QB Client ID/Secret in settings

#### Issue: "Gemini API failed"
- **Fix:** Check Gemini API key is valid
- **Fix:** Verify API key has quota remaining

#### Issue: Content script not injecting
- **Fix:** Reload extension (`chrome://extensions/` → reload)
- **Fix:** Hard refresh QBO page (`Ctrl+Shift+R`)
- **Fix:** Check manifest `content_scripts` matches array

---

## 🔍 Manual Verification Points

### Database Checks (Supabase)

After each test phase, verify in Supabase:

**After QB Sync:**
```sql
SELECT COUNT(*) FROM qb_transactions 
WHERE tenant_id = '[your-tenant-id]' 
AND created_at > NOW() - INTERVAL '1 hour';
```

**After Matching:**
```sql
SELECT status, COUNT(*) FROM matches 
WHERE tenant_id = '[your-tenant-id]' 
GROUP BY status;
```

**After Approval:**
```sql
SELECT * FROM match_audit_log 
WHERE action = 'approved' 
ORDER BY created_at DESC 
LIMIT 10;
```

### QuickBooks API Verification

Use QB API Explorer (developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/purchase):

```
GET /v3/company/[realmId]/purchase/[txnId]?minorversion=65
```

Check `PrivateNote` field contains Kyriq verification stamp.

---

## ✅ Final Pre-Production Checklist

Before deploying to production:

- [ ] All Phase 1-8 tests pass
- [ ] No console errors in any view
- [ ] Extension badge works correctly
- [ ] QBO overlay appears on all QB pages
- [ ] Settings persist across browser restarts
- [ ] Multi-company switching works
- [ ] OCR accuracy ≥95% on test checks
- [ ] Matching algorithm produces sensible scores
- [ ] QB API calls succeed (no 401/403 errors)
- [ ] Icons display correctly (16px, 48px, 128px)
- [ ] Branding is consistent (all "Kyriq", no "CheckSync")

---

## 📊 Performance Benchmarks

Expected performance metrics:

| Operation | Expected Time |
|-----------|---------------|
| Login | < 2 seconds |
| QB Sync (100 txns) | < 5 seconds |
| Single check OCR | < 3 seconds |
| Parallel OCR (5 checks) | < 5 seconds |
| Matching (10 checks vs 100 txns) | < 2 seconds |
| Approve & Clear | < 3 seconds |
| Badge update | Every 5 minutes |

---

## 🎯 Test Data Recommendations

For comprehensive testing, prepare:

1. **3-5 check images** with varying quality
2. **QB company** with 50+ transactions in last 30 days
3. **Mix of transaction types:** Purchase, Check, BillPayment
4. **Known matches:** Checks that definitely match QB transactions
5. **Edge cases:** Checks with no match, partial matches, discrepancies

---

## 📝 Test Report Template

After testing, document results:

```
# Kyriq Extension Test Report
Date: [Date]
Tester: [Name]
Extension Version: 1.0.0

## Test Results
- Phase 1 (Auth): ✅ PASS / ❌ FAIL
- Phase 2 (QB Integration): ✅ PASS / ❌ FAIL
- Phase 3 (OCR): ✅ PASS / ❌ FAIL
- Phase 4 (Matching): ✅ PASS / ❌ FAIL
- Phase 5 (Approve): ✅ PASS / ❌ FAIL
- Phase 6 (Filtering): ✅ PASS / ❌ FAIL
- Phase 7 (QBO Overlay): ✅ PASS / ❌ FAIL
- Phase 8 (Badge): ✅ PASS / ❌ FAIL

## Issues Found
1. [Issue description]
2. [Issue description]

## Performance Notes
- Average OCR time: [X] seconds
- Average matching time: [X] seconds

## Recommendations
- [Recommendation 1]
- [Recommendation 2]
```

---

**Next:** See `TESTING-PRODUCTION.md` for production deployment testing.
