# Chrome Extension Testing Guide

## Prerequisites

Before testing, ensure you have:
- ✅ Chrome browser installed
- ✅ Supabase project running (URL and anon key)
- ✅ QuickBooks Developer account with OAuth credentials
- ✅ Gemini API key from Google AI Studio
- ✅ Test QuickBooks Online company with sample transactions

---

## Part 1: Load Extension in Developer Mode

### Step 1: Enable Developer Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Toggle **Developer mode** ON (top-right corner)
3. You should now see "Load unpacked", "Pack extension", and "Update" buttons

### Step 2: Load the Extension

1. Click **Load unpacked**
2. Navigate to: `c:\Users\inkno\Documents\GitHub\cheque-extractor\chrome-extension\`
3. Select the folder and click **Select Folder**
4. The extension should appear in your extensions list with:
   - Name: **Kyriq**
   - Version: **1.0.0**
   - Status: **Enabled**

### Step 3: Pin the Extension

1. Click the puzzle piece icon (🧩) in Chrome toolbar
2. Find "Kyriq" in the list
3. Click the pin icon to keep it visible in your toolbar

---

## Part 2: Configure Extension Settings

### Step 1: Open Settings

**Method A:** Click the Kyriq icon → Click ⚙️ Settings button

**Method B:** Right-click the Kyriq icon → Click "Options"

### Step 2: Enter Configuration

Fill in all required fields:

| Field | Where to Get It | Example |
|-------|----------------|---------|
| **Supabase URL** | Supabase Dashboard → Settings → API → Project URL | `https://xxxxx.supabase.co` |
| **Supabase Anon Key** | Supabase Dashboard → Settings → API → `anon` public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **QB Client ID** | Intuit Developer Portal → My Apps → [Your App] → Keys & credentials | `ABxxxxxxxxxxxxxxxx` |
| **QB Client Secret** | Intuit Developer Portal → My Apps → [Your App] → Keys & credentials | `xxxxxxxxxxxxxxxx` |
| **Gemini API Key** | Google AI Studio → Get API Key | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |

### Step 3: Save Settings

1. Click **💾 Save Settings**
2. You should see "Settings saved!" confirmation
3. Click **← Back** to return to main view

---

## Part 3: Test Authentication

### Step 1: Login

1. Click the Kyriq extension icon
2. Enter your credentials:
   - **Email:** Your Supabase user email
   - **Password:** Your password
3. Click **Log In**

**Expected Result:**
- Login view disappears
- Company switcher bar appears
- Tabs (Matches, Upload, History) appear
- "Matches" tab is active by default

### Step 2: Verify Login State

1. Click ⚙️ Settings
2. Scroll down to see your email displayed
3. "Log Out" button should be visible
4. Click **← Back**

**Troubleshooting:**
- ❌ "Invalid credentials" → Check Supabase URL/key are correct
- ❌ Extension doesn't respond → Check browser console (`F12` → Console tab)
- ❌ CORS errors → Ensure Supabase has correct allowed origins

---

## Part 4: Test QuickBooks Integration

### Step 1: Connect QuickBooks

1. Ensure you're logged in to the extension
2. Click **🔄 Sync** button in the company bar
3. You'll be redirected to QuickBooks OAuth page
4. Select your test company
5. Click **Connect**
6. You'll be redirected back to Chrome

**Expected Result:**
- Company dropdown populates with your QB company name
- Console shows "QB sync complete" (check with F12)

### Step 2: Verify QB Connection

1. Open Chrome DevTools (`F12`)
2. Go to **Console** tab
3. Click **🔄 Sync** again
4. Look for messages like:
   ```
   Fetching QB transactions...
   Found X transactions
   Sync complete
   ```

**Troubleshooting:**
- ❌ OAuth fails → Check QB Client ID/Secret are correct
- ❌ "Unauthorized" → Ensure QB app is in Development/Production mode
- ❌ No transactions → Check your QB company has check transactions

---

## Part 5: Test Check Upload & OCR

### Step 1: Prepare Test Checks

Create or download sample check images:
- ✅ PNG, JPG, or PDF format
- ✅ Clear, readable check images
- ✅ Include check number, date, amount, payee

### Step 2: Upload Checks

1. Click the **Upload** tab
2. **Method A:** Click the upload zone and select files
3. **Method B:** Drag and drop check images onto the upload zone

**Expected Result:**
- Loading spinner appears
- "Extracting check data..." message
- After 2-5 seconds per check, extracted data appears

### Step 3: Verify Extraction

Check that extracted data includes:
- ✅ Check Number
- ✅ Date (YYYY-MM-DD format)
- ✅ Amount (numeric)
- ✅ Payee name

**Example:**
```
Check #1234
Date: 2026-03-15
Amount: $500.00
Payee: ABC Supplies Inc.
```

### Step 4: Match Against QB

1. Click **🔍 Match Against QB** button
2. Wait for matching to complete
3. Switch to **Matches** tab

**Expected Result:**
- Matches appear in the list
- Each match shows:
  - Check details (left side)
  - QB transaction details (right side)
  - Match score (0-100%)
  - Status badge (Pending/Matched/etc.)

**Troubleshooting:**
- ❌ "Gemini API error" → Check API key is valid
- ❌ Poor extraction → Use higher quality check images
- ❌ No matches found → Ensure QB has corresponding transactions

---

## Part 6: Test Matching & Approval

### Step 1: Review Matches

1. Go to **Matches** tab
2. Use filter pills to view different statuses:
   - **All** — All matches
   - **Pending** — Awaiting review
   - **Matched** — Auto-matched (≥80% score)
   - **Disc.** — Discrepancies detected
   - **No Match** — No QB transaction found
   - **Done** — Approved

### Step 2: Manual Approval

1. Find a match with high confidence (≥80%)
2. Click **✅ Approve & Clear** button
3. Wait for confirmation

**Expected Result:**
- Match status changes to "Approved"
- Badge turns green
- QB transaction gets updated with verification note
- Match count updates in filter pills

### Step 3: Bulk Auto-Approve

1. Ensure you have multiple matches with ≥95% confidence
2. Click **✅ Auto-Approve ≥95%** button
3. Confirm the action

**Expected Result:**
- All matches ≥95% are approved automatically
- Status updates for each match
- Notification shows "X matches approved"

### Step 4: Verify in QuickBooks

1. Open QuickBooks Online in a new tab
2. Navigate to the transaction (e.g., Check #1234)
3. Look for the Private Note field

**Expected Result:**
```
[Kyriq] Verified & Cleared 2026-03-20
```

**Troubleshooting:**
- ❌ Approval fails → Check QB API permissions
- ❌ Note not appearing → Refresh QB page, check API response in console
- ❌ "Token expired" → Extension should auto-refresh, if not, re-sync

---

## Part 7: Test QBO Overlay (Content Script)

### Step 1: Navigate to QuickBooks Online

1. Open a new tab
2. Go to `https://app.qbo.intuit.com/`
3. Log in to your QB company

### Step 2: Verify Overlay Injection

**Expected Result:**
- A floating **Kyriq** button appears (usually bottom-right)
- Button has green gradient styling
- Button shows "CS" or Kyriq logo

### Step 3: Open Overlay Panel

1. Click the floating Kyriq button
2. Panel slides in from the right

**Expected Result:**
- Panel shows match summary
- Displays recent matches
- Shows company name
- Has "View All" link

### Step 4: Test Overlay Features

1. Click on a match in the overlay
2. Verify it shows match details
3. Test approve button from overlay

**Troubleshooting:**
- ❌ No overlay appears → Check content script is injected (F12 → Elements → search for "kyriq")
- ❌ Overlay styling broken → Check CSS file loaded
- ❌ Overlay doesn't respond → Check console for errors

---

## Part 8: Test Multi-Company Switching

### Step 1: Connect Multiple Companies

1. Connect to a second QB company (if available)
2. Both should appear in company dropdown

### Step 2: Switch Companies

1. Click company dropdown in extension
2. Select different company
3. Click **🔄 Sync**

**Expected Result:**
- Matches refresh for selected company
- Upload tab shows correct company context
- QB overlay updates (if on QBO page)

---

## Part 9: Browser Console Testing

### Check for Errors

1. Open DevTools (`F12`)
2. Go to **Console** tab
3. Look for:
   - ✅ No red errors
   - ✅ Successful API calls
   - ✅ "Extension loaded" message

### Check Network Requests

1. Go to **Network** tab
2. Filter by:
   - `supabase.co` — Auth and data requests
   - `intuit.com` — QB API calls
   - `googleapis.com` — Gemini OCR calls

**Expected Result:**
- All requests return 200 or 201 status
- No 401/403 errors
- Reasonable response times (<3s)

### Check Storage

1. Go to **Application** tab
2. Expand **Storage** → **Local Storage** → **Extension**
3. Verify stored data:
   - `supabase_url`
   - `supabase_key`
   - `qb_client_id`
   - `session` (after login)

---

## Part 10: Test Edge Cases

### Test 1: Offline Behavior

1. Disconnect internet
2. Try to upload a check

**Expected Result:**
- Error message: "Network error, please check connection"
- Extension doesn't crash

### Test 2: Invalid API Keys

1. Go to Settings
2. Change Gemini API key to invalid value
3. Try to upload a check

**Expected Result:**
- Error message: "OCR failed, check API key"
- Extension recovers gracefully

### Test 3: Session Expiry

1. Wait for session to expire (or manually clear storage)
2. Try to perform an action

**Expected Result:**
- Redirected to login screen
- No data loss

### Test 4: Large File Upload

1. Try uploading a 10MB+ check image

**Expected Result:**
- Either processes successfully or shows size limit error
- No browser freeze

---

## Part 11: Performance Testing

### Metrics to Check

| Action | Expected Time |
|--------|---------------|
| Extension popup opens | <500ms |
| Login | <2s |
| QB Sync (100 transactions) | <5s |
| OCR extraction (1 check) | 2-4s |
| Matching (1 check vs 100 QB) | <1s |
| Approve & Clear | <2s |

### Memory Usage

1. Open Chrome Task Manager (`Shift + Esc`)
2. Find "Extension: Kyriq"
3. Check memory usage

**Expected Result:**
- <50MB idle
- <150MB during OCR processing

---

## Part 12: Accessibility Testing

### Keyboard Navigation

1. Open extension popup
2. Press `Tab` to navigate
3. Press `Enter` to activate buttons

**Expected Result:**
- All interactive elements are focusable
- Focus indicators visible
- Logical tab order

### Screen Reader

1. Enable screen reader (Windows: Narrator, Mac: VoiceOver)
2. Navigate through extension

**Expected Result:**
- Buttons have descriptive labels
- Form fields have labels
- Status messages are announced

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Extension won't load | Check manifest.json syntax, reload extension |
| Login fails | Verify Supabase URL/key, check CORS settings |
| QB sync fails | Check OAuth credentials, ensure QB app is active |
| OCR fails | Verify Gemini API key, check image quality |
| Matches don't appear | Ensure QB has transactions, check date ranges |
| Approve fails | Check QB API permissions, verify token validity |
| Overlay not showing | Check content script permissions, reload QB page |

---

## Debugging Tips

### Enable Verbose Logging

Add to `service-worker.js`:
```javascript
const DEBUG = true;
if (DEBUG) console.log('[Kyriq]', ...args);
```

### Inspect Service Worker

1. Go to `chrome://extensions/`
2. Find Kyriq
3. Click "service worker" link
4. DevTools opens for background script

### Inspect Content Script

1. Open QB page
2. Press `F12`
3. Console shows content script logs
4. Elements tab shows injected overlay

### Check Permissions

```javascript
chrome.permissions.getAll((permissions) => {
  console.log('Permissions:', permissions);
});
```

---

## Pre-Submission Checklist

Before submitting to Chrome Web Store:

- [ ] All features tested and working
- [ ] No console errors
- [ ] Icons generated (16, 48, 128px)
- [ ] Manifest version correct
- [ ] Privacy policy prepared
- [ ] Screenshots captured (1280x800 or 640x400)
- [ ] Promotional images ready
- [ ] Description written
- [ ] Support email configured
- [ ] Pricing/licensing decided

---

## Next Steps

Once testing is complete, proceed to the **Chrome Web Store Submission Guide** to publish your extension.
