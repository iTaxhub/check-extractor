# Kyriq Chrome Extension — Setup Guide

Quick 2-minute setup to get the extension running.

---

## 🔧 Step 1: Configure Bootstrap Credentials

Before loading the extension, you need to update the hardcoded credentials in the service worker.

**File:** `chrome-extension/background/service-worker.js` (lines 9-13)

```javascript
const BOOTSTRAP_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY_HERE',
  backendUrl: 'https://your-app.up.railway.app',
};
```

### Where to Find These Values:

| Field | Where to Get It |
|-------|----------------|
| **supabaseUrl** | Supabase Dashboard → Settings → API → Project URL |
| **supabaseAnonKey** | Supabase Dashboard → Settings → API → `anon` `public` key |
| **backendUrl** | Railway Dashboard → your frontend service → domain (e.g. `https://web-production-abc123.up.railway.app`) |

**Example:**
```javascript
const BOOTSTRAP_CONFIG = {
  supabaseUrl: 'https://xyzabc123.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk...',
  backendUrl: 'https://web-production-abc123.up.railway.app',
};
```

---

## 🚀 Step 2: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to and select: `C:\Users\inkno\Documents\GitHub\cheque-extractor\chrome-extension`
5. The Kyriq extension should now appear in your extensions list

**Expected Result:** ✅ Kyriq icon appears in Chrome toolbar with no errors

---

## 🎯 Step 3: Test the Extension

### Open as Side Panel (Recommended)
1. Click the Kyriq icon in Chrome toolbar
2. Side panel opens on the right side of the browser (like Tango)
3. Enter your email and password
4. Click **Log In**

**Expected Result:** ✅ You see the company switcher and Matches tab

### Features:
- **Side Panel** — Opens on the right side, stays open while browsing
- **QBO Overlay** — When you visit QuickBooks Online, a green "K" button appears bottom-right
- **Badge** — Shows pending match count on the extension icon
- **Upload** — Drag check images to extract data with Gemini AI
- **Match** — Auto-match checks against QB transactions
- **Approve & Clear** — Mark QB transactions as Cleared with one click

---

## 🔍 Troubleshooting

### Extension Won't Load
- **Error:** "Invalid value for 'content_scripts[0].matches[3]'"
  - **Fixed!** Invalid wildcard `c*.qbo.intuit.com` was removed from manifest

### Login Shows Error
- **Error:** "Cannot load configuration"
  - **Fix:** Update `BOOTSTRAP_CONFIG` in `service-worker.js` with your actual credentials

### Side Panel Doesn't Open
- **Fix:** Reload the extension (`chrome://extensions/` → Kyriq → ↺ reload button)
- **Note:** Side panel requires Chrome 114+

### OCR Not Working
- **Fix:** Ensure `backendUrl` in `BOOTSTRAP_CONFIG` points to your deployed Railway app
- **Note:** Backend must have `GEMINI_API_KEY` environment variable set

### QB Token Refresh Fails
- **Fix:** Ensure backend has these environment variables:
  - `QUICKBOOKS_CLIENT_ID`
  - `QUICKBOOKS_CLIENT_SECRET`
- **Note:** Token refresh is proxied through backend to keep client secret secure

---

## 📚 Additional Documentation

- **Local Testing:** `TESTING-LOCAL.md` — Comprehensive 60-minute test suite
- **Production Deploy:** `TESTING-PRODUCTION.md` — Chrome Web Store submission guide
- **Backend Integration:** `BACKEND-INTEGRATION.md` — API endpoint specifications
- **Extension Overview:** `README.md` — Architecture and features

---

## ✅ Quick Verification Checklist

After setup, verify these work:

- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] Side panel opens when clicking extension icon
- [ ] Login works with valid credentials
- [ ] Company switcher shows your QB connections
- [ ] Upload tab accepts check images
- [ ] Matches tab displays after syncing QB
- [ ] QBO overlay appears on QuickBooks Online pages
- [ ] Badge shows pending match count

---

**Setup Time:** 2 minutes  
**First Login:** Instant  
**Ready to Use:** Immediately after login ✅
