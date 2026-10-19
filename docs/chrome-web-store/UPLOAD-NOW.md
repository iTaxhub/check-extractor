# Upload Kyriq 1.2.1 to the Chrome Web Store — handoff

Everything below is ready. You upload; nothing here was submitted on your behalf.

## What is done

| Item | State |
|---|---|
| Store zip | `dist/kyriq-extension-1.2.1.zip` (20 files, 127 KB), built with `python chrome-extension/package_store.py`. `dist/` is gitignored, so rebuild it with that command on any fresh checkout. |
| Packaged manifest | MV3, version 1.2.1, permissions `storage, tabs, alarms, sidePanel`, hosts: supabase, quickbooks.api.intuit.com, kyriq.com, the Railway backend. No localhost or wildcard hosts. Every file the manifest references is in the zip. |
| Parity check | `node chrome-extension/check-parity.mjs` → 11 checks passed |
| Privacy policy | https://kyriq.com/privacy names Google Gemini, OpenAI, Hugging Face, Railway, Supabase, Vercel and Intuit as sub-processors (`frontend/app/(public)/privacy/page.tsx`). |
| Graphics | all five screenshots and both promo tiles exist (paths below) |

## Not verified — for you, before you press Submit

The built-in browser cannot open `chrome://extensions`, and the QuickBooks checklist needs your sign-in:

- [ ] `chrome://extensions` → Developer mode → Load unpacked → `chrome-extension/` → no manifest warnings
- [ ] Sign in through the side panel
- [ ] The badge shows a count
- [ ] The overlay appears on a QuickBooks register
- [ ] Approving one match clears exactly one row
- [ ] Migration 035 (14-day PDF retention sweep) is applied in production, since the privacy policy promises it
- [ ] A reviewer account on kyriq.com connected to a QuickBooks **sandbox** company (for the Test instructions field)

## Files to upload

```
dist/kyriq-extension-1.2.1.zip
chrome-extension/store-assets/store-icon-128.png
chrome-extension/store-assets/screenshots/kyriq-1-match-1280x800.jpg
chrome-extension/store-assets/screenshots/kyriq-2-approve-1280x800.jpg
chrome-extension/store-assets/screenshots/kyriq-3-upload-1280x800.jpg
chrome-extension/store-assets/screenshots/kyriq-4-done-1280x800.jpg
chrome-extension/store-assets/screenshots/kyriq-5-signin-1280x800.jpg
chrome-extension/store-assets/small-promo-tile-440x280.png
chrome-extension/store-assets/marquee-promo-tile-1400x560.png
```

## Listing text

Every field is in `SUBMISSION.md`, ready to paste. The three the reviewer reads first:

**Privacy policy URL**
```
https://kyriq.com/privacy
```

**Single purpose description** (`SUBMISSION.md` → section 2)
```
Kyriq reconciles paper checks against QuickBooks Online. Inside QuickBooks register and
reconcile pages, the extension shows the user's checks alongside the matching QuickBooks
transactions and, when the user approves a match, marks that transaction as cleared in
QuickBooks. Everything the extension does serves that one purpose.
```

**Permission justifications** (`SUBMISSION.md` → section 2, "Permission justifications"): one block each
for `storage`, `tabs`, `alarms`, `sidePanel` and the host permissions. Remote code: **No**.

Also from `SUBMISSION.md`: the Description (section 1), category `Workflow & Planning`, the five
data-usage ticks and three certifications (section 2), distribution Free / Public / All regions
(section 3), and the 500-character test instructions (section 4).

Do not copy from `chrome-extension/WEB-STORE-SUBMISSION.md`; it is stale.

## Exact clicks in the developer console

1. Open https://chrome.google.com/webstore/devconsole and sign in with the publisher account.
2. Open item **Kyriq**, ID `apnglhjejjghgmcinkoeganejmkjmkpk` (not the older `acmmjfml…` item).
3. **Package** (left nav) → **Upload new package** → choose `dist/kyriq-extension-1.2.1.zip`. Wait for "1.2.1" to appear as the version. Any manifest error shows here; stop and fix if it does.
4. **Store listing** → paste the Description from `SUBMISSION.md` section 1; set Category and Language; upload the store icon, the five screenshots in order 1–5, the small tile and the marquee tile; set Official URL and Support URL to `https://kyriq.com`. **Save draft**.
5. **Privacy** → paste the Single purpose description; paste each permission justification into its box; Remote code → No; tick the five data-usage categories and the three certifications; Privacy policy URL `https://kyriq.com/privacy`. **Save draft**.
6. **Distribution** → Free of charge, Public, All regions. **Save draft**.
7. **Test instructions** (under Privacy or Store listing depending on console version) → enter the reviewer username and password, paste the 500-character instructions from `SUBMISSION.md` section 4. **Save draft**.
8. Run the "Not verified" checklist above.
9. **Submit for review** (top right). Leave "Publish automatically after review" unticked if you want to control the go-live moment. Review usually takes 1–3 business days.
