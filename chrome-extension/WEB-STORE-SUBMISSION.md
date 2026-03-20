# Chrome Web Store Submission Guide

Complete guide to publishing Kyriq Chrome Extension to the Chrome Web Store.

---

## Prerequisites

Before starting, ensure you have:
- ✅ Completed all testing (see `TESTING-GUIDE.md`)
- ✅ Google account for Chrome Web Store Developer
- ✅ $5 USD one-time developer registration fee
- ✅ Privacy policy URL
- ✅ Support email address
- ✅ Extension icons (16x16, 48x48, 128x128 PNG)
- ✅ Promotional images and screenshots

---

## Part 1: Developer Account Setup

### Step 1: Register as Chrome Web Store Developer

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Accept the Developer Agreement
4. Pay the **$5 one-time registration fee**
5. Complete your developer profile:
   - **Developer name:** iTax Hub (or your company name)
   - **Email:** Your support email
   - **Website:** Your company website (optional)

### Step 2: Verify Email

1. Check your email for verification link
2. Click the link to verify your account
3. Return to the Developer Dashboard

---

## Part 2: Prepare Extension Assets

### Step 1: Generate Icons (if not done)

Icons are already in `chrome-extension/icons/` folder:
- `icon16.png` — 16×16px (toolbar)
- `icon48.png` — 48×48px (extensions page)
- `icon128.png` — 128×128px (Web Store listing)

**Verify icons:**
```powershell
cd c:\Users\inkno\Documents\GitHub\cheque-extractor\chrome-extension\icons
dir *.png
```

If missing, open `generate-icons.html` in browser and save each canvas.

### Step 2: Create Promotional Images

**Required:**

1. **Small Promo Tile** — 440×280px
   - Used in Web Store search results
   - Show Kyriq logo + tagline
   - PNG or JPEG

2. **Marquee Promo Tile** — 1400×560px (optional but recommended)
   - Featured placement
   - Show app UI + key features
   - PNG or JPEG

3. **Screenshots** — 1280×800px or 640×400px (at least 1, max 5)
   - Show extension popup in action
   - Show matches list
   - Show upload interface
   - Show QB overlay
   - PNG or JPEG

**Design Tips:**
- Use Kyriq brand colors: Green gradient `#10b981` → `#059669`
- Include clear text describing features
- Show real UI, not mockups
- Avoid excessive text

**Tools:**
- Figma, Canva, Photoshop, or GIMP
- Screenshot tool: Windows Snipping Tool, ShareX

### Step 3: Take Screenshots

1. Load extension in Chrome
2. Open extension popup
3. Use Windows Snipping Tool (`Win + Shift + S`)
4. Capture:
   - **Screenshot 1:** Login screen
   - **Screenshot 2:** Matches list with data
   - **Screenshot 3:** Upload interface
   - **Screenshot 4:** QB overlay on QBO page
   - **Screenshot 5:** Settings page

5. Resize to 1280×800px or 640×400px
6. Save as PNG

### Step 4: Prepare Privacy Policy

**Required for extensions that:**
- Handle user data
- Use OAuth
- Access external APIs

**Create a privacy policy page** that covers:
- What data you collect (email, QB data, check images)
- How you use it (matching, reconciliation)
- How you store it (Supabase, encrypted)
- Third-party services (QuickBooks, Gemini AI)
- User rights (access, deletion)
- Contact information

**Host it at:**
- Your company website: `https://yourcompany.com/privacy`
- GitHub Pages: `https://yourusername.github.io/kyriq-privacy`
- Google Docs (public link)

**Template:**
```markdown
# Privacy Policy for Kyriq Chrome Extension

Last updated: March 20, 2026

## Data Collection
Kyriq collects:
- Email address for authentication
- QuickBooks transaction data
- Uploaded check images
- Match results and approval history

## Data Usage
We use your data to:
- Authenticate users via Supabase
- Match checks against QuickBooks transactions
- Extract check data using Google Gemini AI
- Update QuickBooks transactions with verification notes

## Data Storage
- Stored in Supabase (PostgreSQL)
- Encrypted in transit (HTTPS) and at rest
- Retained until user deletes account

## Third-Party Services
- Supabase (authentication, database)
- QuickBooks API (transaction sync)
- Google Gemini AI (OCR extraction)

## User Rights
You can:
- Access your data anytime
- Delete your account and data
- Export your data

## Contact
Email: support@yourcompany.com

## Changes
We may update this policy. Check this page for updates.
```

---

## Part 3: Package Extension

### Step 1: Clean Build

Remove any development files:
```powershell
cd c:\Users\inkno\Documents\GitHub\cheque-extractor\chrome-extension
# Remove any .DS_Store, Thumbs.db, or temp files
Remove-Item -Recurse -Force .DS_Store -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force Thumbs.db -ErrorAction SilentlyContinue
```

### Step 2: Verify Manifest

Check `manifest.json`:
```json
{
  "manifest_version": 3,
  "name": "Kyriq",
  "version": "1.0.0",
  "description": "AI-powered check reconciliation for QuickBooks. Upload checks, auto-match, and mark transactions as Cleared — right from your browser.",
  ...
}
```

**Important fields:**
- `name` — Max 45 characters
- `version` — Format: `X.Y.Z` (e.g., `1.0.0`)
- `description` — Max 132 characters
- `icons` — All paths correct
- `permissions` — Only what you need
- `host_permissions` — Only required domains

### Step 3: Create ZIP Archive

**Option A: Windows Explorer**
1. Navigate to `chrome-extension/` folder
2. Select all files and folders inside (NOT the parent folder)
3. Right-click → Send to → Compressed (zipped) folder
4. Name it `kyriq-extension-v1.0.0.zip`

**Option B: PowerShell**
```powershell
cd c:\Users\inkno\Documents\GitHub\cheque-extractor
Compress-Archive -Path chrome-extension\* -DestinationPath kyriq-extension-v1.0.0.zip
```

**Verify ZIP contents:**
- manifest.json (at root level, not in subfolder)
- background/
- popup/
- content/
- icons/
- options/

**❌ Common mistake:** Zipping the parent folder creates `chrome-extension/manifest.json` instead of `manifest.json` at root.

---

## Part 4: Submit to Chrome Web Store

### Step 1: Create New Item

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **New Item** button
3. Click **Choose file** and select `kyriq-extension-v1.0.0.zip`
4. Click **Upload**

**Wait for upload to complete** (usually 10-30 seconds)

### Step 2: Fill Store Listing

#### Product Details

**Display Name:**
```
Kyriq - QuickBooks Check Reconciliation
```
(Max 45 characters)

**Summary:**
```
AI-powered check reconciliation for QuickBooks. Upload checks, auto-match transactions, and mark as Cleared.
```
(Max 132 characters)

**Description:**
```
Kyriq streamlines check reconciliation for QuickBooks Online with AI-powered automation.

🚀 KEY FEATURES

✅ Upload Check Images
Drag and drop check images (PNG, JPG, PDF) directly from the extension popup.

🤖 AI OCR Extraction
Gemini AI extracts check number, date, amount, and payee with 98.7% accuracy.

🎯 Smart Matching
Advanced algorithm matches checks against QuickBooks transactions:
• Amount matching (40 points)
• Check number matching (30 points)
• Date proximity (15 points)
• Payee similarity (15 points)

✅ One-Click Approval
Approve matches and mark QuickBooks transactions as Cleared with a single click.

🏢 Multi-Company Support
Switch between multiple QuickBooks companies instantly.

📊 Real-Time Sync
Pull the latest transactions from QuickBooks with one click.

🔍 QuickBooks Overlay
Floating panel on QuickBooks Online pages shows match status in real-time.

⚡ Bulk Auto-Approve
Automatically approve all matches with ≥95% confidence score.

💼 PERFECT FOR

• Accounting firms managing multiple clients
• Small businesses reconciling checks monthly
• Bookkeepers handling high check volumes
• Anyone tired of manual QuickBooks reconciliation

🔒 SECURITY

• Secure OAuth 2.0 authentication
• Encrypted data storage
• SOC 2 compliant infrastructure
• No data shared with third parties

💰 PRICING

$300/year subscription
Built by iTax Hub

📧 SUPPORT

Email: support@yourcompany.com
Documentation: https://yourcompany.com/docs

🎓 HOW IT WORKS

1. Install extension and configure settings
2. Connect your QuickBooks company
3. Upload check images
4. AI extracts check data automatically
5. Smart matching finds corresponding QB transactions
6. Review and approve matches
7. Transactions marked as Cleared in QuickBooks

Start reconciling checks 10x faster today!
```

**Category:**
- Primary: **Productivity**
- Secondary: **Business Tools** (if available)

**Language:**
- English (United States)

#### Visual Assets

1. **Icon** — Auto-populated from manifest (128×128)
2. **Small Promo Tile** — Upload 440×280px image
3. **Marquee Promo Tile** — Upload 1400×560px image (optional)
4. **Screenshots** — Upload 1-5 screenshots (1280×800 or 640×400)

#### Additional Fields

**Website:**
```
https://yourcompany.com
```

**Support URL:**
```
https://yourcompany.com/support
```
(or email: `support@yourcompany.com`)

**Privacy Policy:**
```
https://yourcompany.com/privacy
```

### Step 3: Distribution Settings

**Visibility:**
- ☑️ **Public** — Anyone can find and install
- ☐ **Unlisted** — Only people with link can install
- ☐ **Private** — Only specific users/groups

**Regions:**
- Select **All regions** or specific countries

**Pricing:**
- ☐ Free
- ☑️ **Paid** (if you have in-app purchases or subscription)
  - Note: Chrome Web Store doesn't handle payments, you manage billing separately

### Step 4: Privacy Practices

**Single Purpose:**
```
Kyriq automates check reconciliation for QuickBooks Online by extracting check data with AI and matching against transactions.
```

**Permission Justification:**

For each permission in manifest, explain why:

| Permission | Justification |
|------------|---------------|
| `storage` | Store user settings, session data, and extension configuration |
| `identity` | Authenticate users via Supabase OAuth |
| `activeTab` | Inject QuickBooks overlay on QBO pages |
| `notifications` | Notify users of match completion and sync status |

**Host Permissions:**

| Host | Justification |
|------|---------------|
| `*.supabase.co` | Backend database and authentication |
| `quickbooks.api.intuit.com` | Sync QuickBooks transactions and update Cleared status |
| `oauth.platform.intuit.com` | QuickBooks OAuth authentication |
| `generativelanguage.googleapis.com` | Gemini AI for check OCR extraction |

**Data Usage:**

- ☑️ Collects user data
- Data types: **Authentication info, Financial data, User activity**
- Usage: **App functionality, Analytics**
- ☑️ Data is encrypted in transit
- ☑️ Data is encrypted at rest
- ☐ Data is sold to third parties
- ☑️ Users can request data deletion

**Certification:**
- ☑️ I certify that my extension complies with Chrome Web Store policies

### Step 5: Review & Submit

1. Click **Save draft**
2. Review all fields for accuracy
3. Click **Submit for review**
4. Confirm submission

**Expected Review Time:** 1-3 business days (sometimes up to 7 days)

---

## Part 5: Review Process

### What Google Reviews

1. **Functionality** — Extension works as described
2. **Permissions** — Only requests necessary permissions
3. **Privacy** — Complies with privacy policy
4. **Content** — No prohibited content
5. **Deceptive behavior** — No misleading claims
6. **Security** — No malware or vulnerabilities

### Common Rejection Reasons

| Reason | Solution |
|--------|----------|
| Excessive permissions | Remove unused permissions from manifest |
| Missing privacy policy | Add valid privacy policy URL |
| Misleading description | Ensure description matches actual features |
| Broken functionality | Test thoroughly before submission |
| Keyword stuffing | Use natural language in description |
| Copyright violation | Ensure you own all assets and branding |

### If Rejected

1. Check email for rejection notice
2. Read the specific reason
3. Fix the issue
4. Re-upload corrected ZIP
5. Re-submit for review

---

## Part 6: Post-Publication

### Step 1: Verify Listing

1. Go to your extension's Web Store page
2. Check all information displays correctly
3. Test installation from Web Store

### Step 2: Monitor Reviews

1. Check Developer Dashboard regularly
2. Respond to user reviews
3. Address reported issues

### Step 3: Update Extension

**For updates:**
1. Increment version in `manifest.json` (e.g., `1.0.0` → `1.0.1`)
2. Create new ZIP
3. Go to Developer Dashboard
4. Click your extension
5. Click **Upload Updated Package**
6. Upload new ZIP
7. Update description if needed
8. Submit for review

**Version numbering:**
- **Major:** `2.0.0` — Breaking changes
- **Minor:** `1.1.0` — New features
- **Patch:** `1.0.1` — Bug fixes

### Step 4: Analytics

Track metrics in Developer Dashboard:
- **Installs** — Total installations
- **Weekly users** — Active users
- **Uninstalls** — Churn rate
- **Ratings** — User satisfaction

---

## Part 7: Marketing Your Extension

### Chrome Web Store Optimization

**Keywords to include:**
- QuickBooks
- Check reconciliation
- Accounting automation
- AI OCR
- Bank reconciliation
- Bookkeeping

**Best practices:**
- Use keywords naturally in description
- Add compelling screenshots
- Respond to all reviews
- Keep extension updated

### Promotion Channels

1. **Your website** — Add "Install Extension" button
2. **Social media** — Share on LinkedIn, Twitter
3. **QuickBooks forums** — Help users, mention extension
4. **Accounting blogs** — Write guest posts
5. **Email newsletter** — Announce to existing users
6. **YouTube** — Create demo video

### Demo Video (Optional)

Create a 30-60 second video showing:
1. Installing extension
2. Uploading a check
3. AI extraction
4. Matching
5. Approval

Upload to YouTube and add link to Web Store listing.

---

## Part 8: Compliance & Legal

### Chrome Web Store Policies

Must comply with:
- [Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [User Data Privacy](https://developer.chrome.com/docs/webstore/user_data/)
- [Branding Guidelines](https://developer.chrome.com/docs/webstore/branding/)

### QuickBooks Requirements

If using QuickBooks branding:
- Follow [Intuit Brand Guidelines](https://developer.intuit.com/app/developer/qbo/docs/brand-guidelines)
- Don't imply official Intuit endorsement
- Use "for QuickBooks" not "QuickBooks Extension"

### GDPR Compliance (if serving EU users)

- Obtain user consent for data processing
- Allow data export and deletion
- Appoint data protection officer (if required)
- Update privacy policy with GDPR language

---

## Checklist: Pre-Submission

- [ ] Extension tested thoroughly (see `TESTING-GUIDE.md`)
- [ ] All features working
- [ ] No console errors
- [ ] Icons generated (16, 48, 128px)
- [ ] Manifest version incremented
- [ ] Description written (max 132 chars summary)
- [ ] Screenshots captured (1-5 images)
- [ ] Promo tiles created (440×280, 1400×560)
- [ ] Privacy policy published
- [ ] Support email configured
- [ ] ZIP file created correctly
- [ ] Developer account registered ($5 paid)
- [ ] All permissions justified
- [ ] Privacy practices filled out
- [ ] Pricing/licensing decided

---

## Checklist: Post-Submission

- [ ] Submission confirmed
- [ ] Email notifications enabled
- [ ] Review status monitored
- [ ] Listing verified after approval
- [ ] Test installation from Web Store
- [ ] Analytics tracking set up
- [ ] Marketing plan ready
- [ ] Support system in place
- [ ] Update schedule planned

---

## Support Resources

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Extension Development Guide](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Web Store Support](https://support.google.com/chrome_webstore/)

---

## Estimated Timeline

| Phase | Duration |
|-------|----------|
| Prepare assets | 2-4 hours |
| Create listing | 1-2 hours |
| Submit | 5 minutes |
| **Review** | **1-7 days** |
| Publish | Instant |
| **Total** | **1-7 days** |

---

## Cost Summary

| Item | Cost |
|------|------|
| Chrome Web Store Developer Registration | $5 (one-time) |
| Extension development | Already done |
| Icon/image design | Free (DIY) or $50-200 (designer) |
| Privacy policy hosting | Free (GitHub Pages) |
| **Total** | **$5-$205** |

---

## Next Steps After Publication

1. **Monitor reviews** — Respond within 24 hours
2. **Track metrics** — Weekly active users, install rate
3. **Gather feedback** — User surveys, support tickets
4. **Plan updates** — Bug fixes, new features
5. **Marketing** — Promote on social media, forums
6. **Scale** — Add more features, integrations

---

Good luck with your Chrome Web Store submission! 🚀
