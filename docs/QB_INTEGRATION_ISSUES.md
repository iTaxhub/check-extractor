# QuickBooks Integration - Known Issues & Limitations

## 🔴 CRITICAL ISSUES FIXED

### 1. Missing Authorization Headers in QB Comparison Page
**Status:** ✅ FIXED
**Impact:** Extracted cheques not appearing in comparison table
**Root Cause:** QB comparison hook was not sending Authorization headers when fetching jobs and QB entries, causing RLS to block all data.
**Fix:** Added Authorization headers with user session token to all API calls in `useComparisonData.ts`
**Files Changed:**
- `frontend/app/(app)/qb-comparisons/hooks/useComparisonData.ts`

### 2. OAuth Callback Authentication Failure
**Status:** ✅ FIXED
**Impact:** QB OAuth callback failing with "callback_failed" error
**Root Cause:** OAuth callback from Intuit doesn't include Authorization header, but endpoint was using `createAuthenticatedClient()` which requires it.
**Fix:** Created `createClientFromCookies()` function to authenticate using session cookies instead.
**Files Changed:**
- `frontend/lib/supabase/api.ts` - Added `createClientFromCookies()` function
- `frontend/pages/api/qbo/callback.ts` - Use cookies for auth

### 3. Missing tenant_id in OAuth Token Storage
**Status:** ✅ FIXED
**Impact:** OAuth tokens couldn't be saved due to RLS policy violations
**Root Cause:** Callback handler wasn't including `tenant_id` when upserting tokens to `integrations` table.
**Fix:** Added tenant_id retrieval and included in upsert with `onConflict: 'tenant_id,provider'`
**Files Changed:**
- `frontend/pages/api/qbo/callback.ts`

### 4. Global UNIQUE Constraint Breaking Multi-Tenancy
**Status:** ✅ FIXED (SQL migration required)
**Impact:** Only one tenant could have QB integration
**Root Cause:** `integrations` table had `UNIQUE(provider)` instead of `UNIQUE(tenant_id, provider)`
**Fix:** SQL migration to change constraint
**Migration:** `supabase/migrations/011_fix_integrations_unique_constraint.sql`

### 5. Infinite Recursion in user_profiles RLS Policies
**Status:** ✅ FIXED (SQL migration required)
**Impact:** All API calls failing with infinite recursion error
**Root Cause:** `user_profiles` RLS policies were calling `user_tenant_id()` which queries `user_profiles`, creating recursion.
**Fix:** Changed policies to use simple `auth.uid()` checks instead
**Migration:** `supabase/migrations/010_fix_user_profiles_rls_recursion.sql`

---

## ⚠️ KNOWN LIMITATIONS

### 1. QuickBooks API Rate Limits
**Impact:** HIGH
**Description:** 
- QuickBooks API has rate limits: 500 requests per minute per app, 100 requests per minute per realm
- Pulling large datasets may hit rate limits
**Mitigation:**
- Implement exponential backoff retry logic
- Cache QB data in `qb_entries` table
- Use date range filters to reduce data volume
**Files to Update:**
- `frontend/pages/api/qbo/pull-checks.ts` - Add rate limit handling

### 2. Token Expiration (1 hour)
**Impact:** MEDIUM
**Description:**
- QB access tokens expire after 1 hour
- Refresh tokens expire after 100 days of inactivity
**Current Handling:**
- Token refresh implemented in `pull-checks.ts`
- Checks expiration before each API call
**Potential Issues:**
- Long-running operations may fail mid-execution
- No automatic token refresh for background jobs
**Mitigation Needed:**
- Add token refresh to all QB API endpoints
- Implement background job to refresh tokens before expiry

### 3. MAXRESULTS Limit (1000 records)
**Impact:** MEDIUM
**Description:**
- QuickBooks API limits query results to 1000 records per request
- Large companies may have more than 1000 cheques
**Current Handling:**
- Using `MAXRESULTS 1000` in queries
- No pagination implemented
**Mitigation Needed:**
- Implement pagination using `STARTPOSITION` parameter
- Add incremental sync to only fetch new/updated records
**Files to Update:**
- `frontend/pages/api/qbo/pull-checks.ts` - Add pagination logic

### 4. Missing Check Numbers
**Impact:** MEDIUM
**Description:**
- Not all QB transactions have check numbers (DocNumber)
- BillPayment may use PrintStatus instead
- Payment uses PaymentRefNum
**Current Handling:**
- Normalizers handle missing check numbers with empty strings
**Issues:**
- Comparison matching relies on check numbers
- Missing check numbers = no match
**Mitigation:**
- Implement fuzzy matching on date + amount + payee
- Add manual matching UI for unmatched entries

### 5. Payment Method Detection
**Impact:** LOW-MEDIUM
**Description:**
- Payment entity requires client-side filtering for cheque payments
- Relies on PaymentMethodRef.name containing "check" or "cheque"
- Different companies may use different naming conventions
**Current Handling:**
- Case-insensitive substring match on payment method name
**Potential Issues:**
- May miss cheques with non-standard payment method names
- May include non-cheque payments if method name is ambiguous
**Mitigation:**
- Allow users to configure payment method names
- Add manual classification UI

### 6. Currency Handling
**Impact:** LOW
**Description:**
- Multi-currency transactions may have different amounts in different currencies
- Current implementation only stores single amount value
**Current Handling:**
- Storing currency in `currency` field
- No currency conversion
**Mitigation Needed:**
- Add currency conversion for comparison
- Display currency alongside amounts

### 7. Sandbox vs Production
**Impact:** LOW
**Description:**
- Sandbox and production use different API endpoints
- Sandbox data doesn't sync to production
**Current Handling:**
- `sandbox=true` query parameter switches endpoints
**Issues:**
- No clear indication in UI whether using sandbox or production
**Mitigation:**
- Add sandbox indicator in UI
- Separate sandbox and production credentials

---

## 🔧 REQUIRED FIXES

### Priority 1: Add Authorization Headers to All API Calls
**Status:** ✅ COMPLETED
- Settings page ✅
- QB OAuth endpoint ✅
- QB comparison page ✅
- Dashboard page ✅

### Priority 2: Implement Token Refresh in All QB Endpoints
**Status:** ⚠️ PARTIAL
- `pull-checks.ts` ✅ Has token refresh
- `disconnect.ts` ❌ No token handling needed
- Other endpoints ❌ Need to add token refresh

### Priority 3: Add Pagination for Large Datasets
**Status:** ❌ NOT STARTED
**Files to Update:**
- `frontend/pages/api/qbo/pull-checks.ts`
**Implementation:**
- Add `STARTPOSITION` parameter to queries
- Loop until all records fetched
- Store progress in case of interruption

### Priority 4: Improve Matching Algorithm
**Status:** ⚠️ BASIC IMPLEMENTATION
**Current:** Exact check number matching only
**Needed:**
- Fuzzy matching on date + amount + payee
- Confidence scoring
- Manual matching UI
**Files to Update:**
- `frontend/app/(app)/qb-comparisons/utils/comparisonUtils.ts`

### Priority 5: Add Error Handling & Retry Logic
**Status:** ⚠️ BASIC IMPLEMENTATION
**Needed:**
- Exponential backoff for rate limits
- Better error messages for users
- Retry failed API calls
**Files to Update:**
- `frontend/pages/api/qbo/pull-checks.ts`
- `frontend/app/(app)/qb-comparisons/hooks/useComparisonData.ts`

---

## 📋 TESTING CHECKLIST

### OAuth Flow
- [ ] Connect to QuickBooks from settings page
- [ ] Verify tokens saved with correct tenant_id
- [ ] Verify redirect back to settings with success message
- [ ] Test token refresh after 1 hour
- [ ] Test with multiple tenants (no conflicts)

### Data Pulling
- [ ] Pull cheques with no filters
- [ ] Pull cheques with date range filter
- [ ] Pull cheques with amount range filter
- [ ] Pull cheques with vendor filter
- [ ] Verify all 3 transaction types pulled (Purchase, BillPayment, Payment)
- [ ] Verify data stored in qb_entries with correct tenant_id

### Comparison Page
- [ ] Verify extracted cheques appear in table
- [ ] Verify QB entries appear in table
- [ ] Verify matched entries show correctly
- [ ] Verify mismatched entries show discrepancies
- [ ] Verify missing entries show in correct columns
- [ ] Test with multiple tenants (data isolation)

### Tenant Isolation
- [ ] User A sees only their own extracted cheques
- [ ] User A sees only their own QB entries
- [ ] User B sees only their own data (no overlap with User A)
- [ ] Each tenant can have separate QB credentials
- [ ] Each tenant can connect to different QB companies

---

## 🚀 DEPLOYMENT CHECKLIST

### Database Migrations
- [x] Run `010_fix_user_profiles_rls_recursion.sql`
- [x] Run `011_fix_integrations_unique_constraint.sql`
- [ ] Verify all users have tenant_id assigned
- [ ] Verify RLS policies working correctly

### Code Deployment
- [x] Push all fixes to GitHub
- [x] Verify Vercel deployment successful
- [ ] Test OAuth flow on production
- [ ] Test QB comparison on production
- [ ] Monitor error logs for issues

### Configuration
- [ ] Set QB credentials in production environment
- [ ] Verify redirect URI matches production URL
- [ ] Test with real QB company data
- [ ] Set up monitoring/alerting for QB API errors

---

## 📞 SUPPORT CONTACTS

- QuickBooks API Documentation: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/purchase
- QuickBooks API Support: https://help.developer.intuit.com/s/
- Rate Limit Info: https://developer.intuit.com/app/developer/qbo/docs/develop/rest-api-features/rate-limits
