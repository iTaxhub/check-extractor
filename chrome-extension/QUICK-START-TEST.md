# Quick Start Testing (5 Minutes)

Fast track to test your Chrome extension is working.

---

## 1. Load Extension (30 seconds)

```powershell
# Open Chrome and navigate to:
chrome://extensions/
```

1. Toggle **Developer mode** ON (top-right)
2. Click **Load unpacked**
3. Select: `c:\Users\inkno\Documents\GitHub\cheque-extractor\chrome-extension\`
4. Pin the extension (click puzzle icon 🧩 → pin Kyriq)

✅ **Success:** Extension appears in toolbar

---

## 2. Configure Settings (2 minutes)

Click Kyriq icon → ⚙️ Settings

**Required fields:**
```
Supabase URL: https://[your-project].supabase.co
Supabase Anon Key: eyJ... (from Supabase Dashboard → API)
QB Client ID: AB... (from Intuit Developer Portal)
QB Client Secret: xxx... (from Intuit Developer Portal)
Gemini API Key: AIza... (from Google AI Studio)
```

Click **💾 Save Settings** → **← Back**

✅ **Success:** "Settings saved!" message appears

---

## 3. Test Login (30 seconds)

1. Enter your email and password
2. Click **Log In**

✅ **Success:** 
- Login screen disappears
- Company dropdown appears
- Tabs (Matches, Upload, History) visible

---

## 4. Test QB Sync (1 minute)

1. Click **🔄 Sync** button
2. Authorize QuickBooks (if first time)
3. Wait for sync to complete

✅ **Success:**
- Company name appears in dropdown
- No errors in console (F12)

---

## 5. Test Upload (1 minute)

1. Click **Upload** tab
2. Drop a check image or click to browse
3. Wait for extraction

✅ **Success:**
- Check data extracted (number, date, amount, payee)
- "Match Against QB" button appears

---

## 6. Test Matching (30 seconds)

1. Click **🔍 Match Against QB**
2. Switch to **Matches** tab

✅ **Success:**
- Matches appear in list
- Match scores shown (0-100%)
- Status badges visible

---

## Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| Extension won't load | Check manifest.json syntax |
| Login fails | Verify Supabase URL/key |
| QB sync fails | Check OAuth credentials |
| OCR fails | Verify Gemini API key |
| No matches | Ensure QB has transactions |

---

## Open DevTools for Debugging

Press **F12** in Chrome:
- **Console** tab → Check for errors
- **Network** tab → Verify API calls
- **Application** tab → Check stored settings

---

**Next:** See `TESTING-GUIDE.md` for comprehensive testing
**Publish:** See `WEB-STORE-SUBMISSION.md` for Chrome Web Store
