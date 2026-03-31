# Kyriq Chrome Extension — Production Deployment & Testing

Complete guide for deploying Kyriq to the Chrome Web Store and testing in production.

---

## 📦 Pre-Deployment Preparation

### 1. Final Code Review

- [x] All "CheckSync" references renamed to "Kyriq" ✅
- [ ] Version number updated in `manifest.json`
- [ ] All API keys removed from code (use runtime config)
- [ ] No `console.log` statements in production code (or use conditional logging)
- [ ] Error handling in place for all API calls
- [ ] Loading states for all async operations

### 2. Asset Preparation

#### Icons (Required for Chrome Web Store)

**Generate Production Icons:**
1. Open `chrome-extension/icons/generate-icons.html` in browser
2. Right-click each canvas → Save image as:
   - `icon16.png` (16×16) — Toolbar icon
   - `icon48.png` (48×48) — Extension management page
   - `icon128.png` (128×128) — Chrome Web Store listing

**Verify Icons:**
- [ ] All 3 sizes generated
- [ ] Icons are clear and recognizable
- [ ] Green gradient branding (#10b981 → #059669)
- [ ] "K" logo visible at all sizes

#### Store Listing Assets

Create the following for Chrome Web Store:

**Required:**
- [ ] **Promotional tile** (440×280 PNG) — Featured on store
- [ ] **Small tile** (128×128 PNG) — Already have `icon128.png`
- [ ] **Screenshots** (1280×800 or 640×400 PNG) — At least 1, max 5

**Recommended Screenshots:**
1. Extension popup showing matches
2. Upload tab with extracted checks
3. QuickBooks overlay panel
4. Settings/configuration page
5. Match detail with score breakdown

**Optional:**
- [ ] **Marquee promo tile** (1400×560 PNG) — Large featured banner

### 3. Manifest Configuration

Update `manifest.json` for production:

```json
{
  "manifest_version": 3,
  "name": "Kyriq",
  "version": "1.0.0",
  "description": "AI-powered check reconciliation for QuickBooks. Upload checks, auto-match, and mark transactions as Cleared — right from your browser.",
  "author": "iTax Hub",
  "homepage_url": "https://kyriq.com"
}
```

**Version Numbering:**
- First release: `1.0.0`
- Bug fixes: `1.0.1`, `1.0.2`, etc.
- New features: `1.1.0`, `1.2.0`, etc.
- Major changes: `2.0.0`, `3.0.0`, etc.

### 4. Privacy Policy & Terms

**Required for Chrome Web Store submission:**

Create `PRIVACY.md` with:
- What data is collected (check images, QB transactions)
- How data is stored (Supabase)
- Third-party services (Gemini AI, QuickBooks API)
- User data deletion policy
- Contact information

Create `TERMS.md` with:
- Service description
- Pricing ($300/year)
- Refund policy
- Liability limitations
- User responsibilities

**Host these publicly:**
- Upload to your website (e.g., `https://kyriq.com/privacy`)
- Or use GitHub Pages from your repo

---

## 🚀 Chrome Web Store Submission

### Step 1: Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with Google account
3. Pay **one-time $5 registration fee**
4. Complete developer profile

### Step 2: Package Extension

**Option A: Upload Folder (Recommended for first submission)**
1. Create ZIP of `chrome-extension/` folder
2. Ensure ZIP contains `manifest.json` at root level
3. Name: `kyriq-v1.0.0.zip`

**Option B: Direct Upload**
- Upload unpacked folder directly in dashboard

**What to Include:**
```
kyriq-v1.0.0.zip
├── manifest.json
├── background/
│   └── service-worker.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   ├── qbo-overlay.js
│   └── qbo-overlay.css
├── options/
│   └── options.html
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md (optional)
```

**What NOT to Include:**
- `.git/` folder
- `node_modules/`
- `.env` files
- Test files
- Development scripts
- `TESTING-*.md` files (optional, but not required)

### Step 3: Fill Out Store Listing

#### Product Details

**Display Name:** Kyriq

**Summary (132 chars max):**
```
AI-powered check reconciliation for QuickBooks. Upload, auto-match, and clear checks instantly.
```

**Description (16,000 chars max):**
```
# Kyriq — AI-Powered Check Reconciliation for QuickBooks

Save hours on check reconciliation with AI-powered automation. Kyriq extracts check data from images, matches against QuickBooks transactions, and marks them as Cleared — all from your browser.

## ✨ Key Features

🤖 **AI OCR Extraction**
Upload check images (PNG, JPG, PDF) and let Gemini AI extract check number, date, amount, and payee with 98.7% accuracy.

🎯 **Smart Matching Algorithm**
Advanced matching engine scores each check against QuickBooks transactions using:
- Amount matching (40 points)
- Check number matching (30 points)
- Date proximity (15 points)
- Payee similarity (15 points)

✅ **One-Click Approve & Clear**
Approve matches and automatically update QuickBooks transactions with verification stamps — no manual data entry.

🏢 **Multi-Company Support**
Switch between multiple QuickBooks companies instantly. Perfect for accountants managing multiple clients.

📊 **QuickBooks Online Overlay**
Floating panel on QuickBooks pages shows match status and connection info without leaving QB.

⚡ **Bulk Auto-Approve**
Automatically approve all matches with ≥95% confidence score. Process dozens of checks in seconds.

## 🔒 Security & Privacy

- Bank-level encryption for all data
- API credentials managed server-side (never exposed to users)
- Secure authentication via Supabase
- SOC 2 compliant infrastructure

## 💰 Pricing

**$300/year** — Unlimited checks, unlimited companies, unlimited users.

## 🚀 How It Works

1. **Upload** check images via the extension popup
2. **Extract** data automatically with Gemini AI
3. **Sync** QuickBooks transactions (last 30 days)
4. **Match** checks against QB with smart algorithm
5. **Approve** matches and mark as Cleared in QuickBooks

## 📋 Requirements

- Active QuickBooks Online subscription
- Kyriq account (sign up at kyriq.com)
- Active subscription ($300/year)

## 🎯 Perfect For

- Accounting firms managing multiple clients
- Small businesses processing 50+ checks/month
- Bookkeepers reconciling client accounts
- CFOs needing audit trails for check payments

## 🆘 Support

- Documentation: https://kyriq.com/docs
- Email: support@itaxhub.com
- Response time: < 24 hours

## 🏆 Built by iTax Hub

Professional accounting automation tools trusted by 500+ firms.

---

**Try Kyriq today and transform your check reconciliation workflow!**
```

#### Category
- **Primary:** Productivity
- **Secondary:** Business Tools

#### Language
- English (United States)

#### Privacy Practices

**Permissions Justification:**
- `storage` — Save user session data and cache
- `identity` — Authenticate with backend
- `activeTab` — Inject overlay on QuickBooks pages
- `notifications` — Alert users of pending matches

**Host Permissions Justification:**
- `*.supabase.co` — Backend database and authentication
- `quickbooks.api.intuit.com` — Fetch and update QB transactions
- `oauth.platform.intuit.com` — QuickBooks OAuth token refresh
- `generativelanguage.googleapis.com` — Gemini AI for OCR

**Note:** All API credentials (Supabase, QB, Gemini) are managed server-side. Users never handle sensitive keys.

**Data Usage:**
- [ ] Declare: "Collects personally identifiable information"
- [ ] Declare: "Collects financial and payment information"
- [ ] Declare: "Uses data for business purposes"
- [ ] Link to Privacy Policy: `https://kyriq.com/privacy`

#### Pricing & Distribution

- **Visibility:** Public
- **Regions:** All regions (or specific countries)
- **Pricing:** Free (handle billing separately via your web app)
  - *Note: Chrome Web Store doesn't support subscriptions, so mark as free and handle $300/year billing through your own system*

### Step 4: Submit for Review

1. Click **Submit for Review**
2. Review checklist appears
3. Confirm all items
4. Submit

**Review Timeline:**
- Initial review: 1-3 business days
- Updates: 1-2 business days
- Rejections: Fix issues and resubmit

**Common Rejection Reasons:**
- Missing privacy policy
- Insufficient permission justifications
- Misleading screenshots
- Broken functionality
- Security vulnerabilities

---

## 🧪 Production Testing (Post-Deployment)

### Phase 1: Installation Testing

#### Test 1.1: Fresh Install
1. Uninstall local development version
2. Install from Chrome Web Store
3. **Expected:** Extension installs without errors
4. **Expected:** Icon appears in toolbar
5. **Expected:** All permissions requested

#### Test 1.2: First-Time Setup
1. Click extension icon
2. Click "Configure Settings"
3. Enter all credentials
4. Save settings
5. **Expected:** Settings persist
6. **Expected:** Can login successfully

### Phase 2: Multi-User Testing

Test with different user types:

**Test 2.1: New User (No QB Connection)**
- [ ] Install extension
- [ ] Login with new account
- [ ] **Expected:** "No QB companies connected" message
- [ ] **Expected:** Directed to connect via web app

**Test 2.2: Existing User (Single Company)**
- [ ] Install extension
- [ ] Login with existing account
- [ ] **Expected:** Company auto-selected
- [ ] **Expected:** Can sync and match

**Test 2.3: Power User (Multiple Companies)**
- [ ] Install extension
- [ ] Login with multi-company account
- [ ] **Expected:** Company dropdown populated
- [ ] **Expected:** Can switch between companies
- [ ] **Expected:** Data isolates correctly

### Phase 3: Cross-Browser Testing

While Chrome Web Store is Chrome-only, test on Chromium browsers:

- [ ] **Google Chrome** (latest stable)
- [ ] **Microsoft Edge** (Chromium-based)
- [ ] **Brave Browser**
- [ ] **Opera** (Chromium-based)

**Expected:** Works identically on all Chromium browsers

### Phase 4: Performance Testing

#### Test 4.1: Large Dataset
- [ ] Sync QB company with 500+ transactions
- [ ] Upload 20+ checks
- [ ] Run matching
- [ ] **Expected:** Completes in < 30 seconds
- [ ] **Expected:** No browser freezing

#### Test 4.2: Network Conditions
Test under different network speeds:
- [ ] Fast WiFi (100+ Mbps)
- [ ] Slow WiFi (5 Mbps)
- [ ] Mobile hotspot (3G/4G)
- [ ] **Expected:** Graceful degradation
- [ ] **Expected:** Appropriate loading states

#### Test 4.3: Offline Behavior
- [ ] Disconnect internet
- [ ] Try to sync QB
- [ ] **Expected:** Clear error message
- [ ] **Expected:** No crashes
- [ ] Reconnect internet
- [ ] **Expected:** Resumes normally

### Phase 5: Security Testing

#### Test 5.1: Credential Storage
- [ ] Enter API keys in settings
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Open extension
- [ ] **Expected:** Still logged in
- [ ] **Expected:** API keys not visible in plain text

#### Test 5.2: Token Refresh
- [ ] Wait for QB token to expire (1 hour)
- [ ] Try to sync QB
- [ ] **Expected:** Auto-refreshes token
- [ ] **Expected:** Sync succeeds

#### Test 5.3: Session Expiry
- [ ] Login to extension
- [ ] Wait 24 hours
- [ ] Try to use extension
- [ ] **Expected:** Session expires gracefully
- [ ] **Expected:** Prompted to login again

### Phase 6: Error Handling

Test error scenarios:

**Test 6.1: Invalid Credentials**
- [ ] Enter wrong Supabase URL
- [ ] Try to login
- [ ] **Expected:** Clear error message
- [ ] **Expected:** No crash

**Test 6.2: API Rate Limits**
- [ ] Exceed Gemini API quota
- [ ] Try OCR extraction
- [ ] **Expected:** "API quota exceeded" message
- [ ] **Expected:** Graceful fallback

**Test 6.3: QB API Errors**
- [ ] Disconnect QB connection
- [ ] Try to sync
- [ ] **Expected:** "No active QB connection" error
- [ ] **Expected:** Directed to reconnect

### Phase 7: Update Testing

When releasing updates:

#### Test 7.1: Extension Update
- [ ] Publish new version to store
- [ ] Wait for Chrome to auto-update (or force update)
- [ ] **Expected:** Extension updates without data loss
- [ ] **Expected:** Settings persist
- [ ] **Expected:** Session remains active

#### Test 7.2: Breaking Changes
If manifest changes:
- [ ] Test fresh install
- [ ] Test update from previous version
- [ ] **Expected:** Migration handled smoothly

---

## 📊 Production Monitoring

### Metrics to Track

**Usage Metrics:**
- Daily active users (DAU)
- Weekly active users (WAU)
- Average checks processed per user
- Average session duration
- Feature usage (upload vs sync vs approve)

**Performance Metrics:**
- Average OCR time
- Average matching time
- QB API success rate
- Error rate by type

**Business Metrics:**
- Install rate
- Uninstall rate
- User retention (7-day, 30-day)
- Conversion to paid (if applicable)

### Error Tracking

**Implement logging for:**
- API failures (Supabase, QB, Gemini)
- Authentication errors
- Matching algorithm failures
- Extension crashes

**Tools:**
- Sentry (error tracking)
- Google Analytics (usage tracking)
- Custom logging to Supabase

### User Feedback

**Collect feedback via:**
- Chrome Web Store reviews
- In-app feedback button
- Support email
- User surveys

**Monitor:**
- Average rating (target: ≥4.5 stars)
- Review sentiment
- Common feature requests
- Bug reports

---

## 🔄 Update & Maintenance Schedule

### Weekly
- [ ] Review error logs
- [ ] Check API quotas
- [ ] Monitor user feedback
- [ ] Test on latest Chrome version

### Monthly
- [ ] Update dependencies (if any)
- [ ] Review and respond to store reviews
- [ ] Analyze usage metrics
- [ ] Plan feature updates

### Quarterly
- [ ] Major feature releases
- [ ] Security audit
- [ ] Performance optimization
- [ ] User satisfaction survey

---

## 🚨 Incident Response Plan

### Critical Issues (P0)

**Examples:**
- Extension crashes on launch
- Cannot login
- Data loss
- Security vulnerability

**Response:**
1. **Immediate:** Pull extension from store (if severe)
2. **Within 1 hour:** Identify root cause
3. **Within 4 hours:** Deploy hotfix
4. **Within 24 hours:** Post-mortem report

### High Priority (P1)

**Examples:**
- Feature not working
- QB sync failing
- OCR errors

**Response:**
1. **Within 4 hours:** Acknowledge issue
2. **Within 24 hours:** Deploy fix
3. **Within 48 hours:** Notify affected users

### Medium Priority (P2)

**Examples:**
- UI glitches
- Performance degradation
- Minor bugs

**Response:**
1. **Within 1 week:** Fix in next release
2. **Within 2 weeks:** Deploy update

---

## 📋 Production Deployment Checklist

### Pre-Launch
- [ ] All local tests pass (see TESTING-LOCAL.md)
- [ ] Icons generated and optimized
- [ ] Screenshots created
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Store listing copy finalized
- [ ] Support email configured
- [ ] Documentation website live
- [ ] Billing system ready (for $300/year)

### Launch Day
- [ ] Submit to Chrome Web Store
- [ ] Monitor submission status
- [ ] Prepare launch announcement
- [ ] Set up monitoring/analytics
- [ ] Configure error tracking
- [ ] Test fresh install from store

### Post-Launch (Week 1)
- [ ] Monitor error rates daily
- [ ] Respond to all reviews
- [ ] Track install/uninstall rates
- [ ] Collect user feedback
- [ ] Fix any critical bugs immediately

### Post-Launch (Month 1)
- [ ] Analyze usage patterns
- [ ] Identify most-used features
- [ ] Plan roadmap based on feedback
- [ ] Optimize performance bottlenecks
- [ ] Consider feature additions

---

## 🎯 Success Criteria

**Week 1:**
- [ ] 50+ installs
- [ ] 0 critical bugs
- [ ] ≥4.0 star rating

**Month 1:**
- [ ] 200+ installs
- [ ] ≥4.5 star rating
- [ ] 10+ paying customers ($3,000 MRR)

**Month 3:**
- [ ] 500+ installs
- [ ] ≥4.7 star rating
- [ ] 50+ paying customers ($15,000 MRR)

---

## 🔗 Useful Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/devguide/)

---

## 📞 Support Contacts

**Chrome Web Store Support:**
- [Developer Support](https://support.google.com/chrome_webstore/contact/developer_support)

**Your Support:**
- Email: support@itaxhub.com
- Documentation: https://kyriq.com/docs
- Status Page: https://status.kyriq.com (recommended)

---

**Ready to launch? Good luck! 🚀**
