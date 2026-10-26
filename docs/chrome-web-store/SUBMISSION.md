# Chrome Web Store submission â€” Kyriq

Every field, ready to paste. Written against what the code actually does, not marketing copy.

- **Item ID**: `apnglhjejjghgmcinkoeganejmkjmkpk` (confirmed by the owner, 19 Oct 2026; the older ID `acmmjfmlpemmigbbpkohebaehnofcdkg` is not the one to update)
- **Package to upload**: version **1.2.6**, `dist/kyriq-extension-1.2.6.zip` built by `python chrome-extension/package_store.py`
- **Status**: Published (public). Updates go in as a new package plus the listing text below.
- **Store URL** (for `NEXT_PUBLIC_CHROME_EXTENSION_URL` in Vercel, so the site links to it):
  `https://chromewebstore.google.com/detail/apnglhjejjghgmcinkoeganejmkjmkpk`

> **Do not copy from `chrome-extension/WEB-STORE-SUBMISSION.md`.** It is stale and will get the
> submission rejected: it justifies `activeTab` (not in the manifest) and `identity` / `notifications`
> (removed in 1.0.1 because nothing used them), omits `tabs`, `alarms` and `sidePanel` entirely,
> claims "98.7% accuracy" â€” an unsubstantiated performance claim â€” quotes a $300/year price that is
> not current, and every URL in it is a `yourcompany.com` placeholder. This file supersedes it.

---

## 1. Store listing

**Title** *(from package `name`, read-only)*. Keyword-led, as the store's search weights the title most.
```
Kyriq â€“ QuickBooks Check Reconciliation
```

**Summary** *(from package `description`, read-only, 132-char limit, exactly 132)*
```
Clear checks in QuickBooks Online: match scanned and handwritten checks to transactions, approve, and reconcile without leaving QBO.
```

**Category**: `Workflow & Planning`
**Language**: `English (United States)`

**Description**

```
Check reconciliation for QuickBooks Online, inside QuickBooks.

Kyriq reads the checks on your bank statement or check images (scanned or handwritten):
check number, date, amount and payee. It matches each one to its QuickBooks Online
transaction, and lets you clear approved checks right on the QuickBooks reconcile screen.
No more ticking outstanding checks one by one against a paper statement.

This extension is the part of Kyriq that works inside QuickBooks Online. It adds a side
panel and an on-page overlay to your QBO register and Reconcile screens, so reviewing a
match, fixing a discrepancy and marking the check as cleared all happen where you already
work.

WHAT IT DOES

â€¢ Shows your Kyriq checks beside the QuickBooks register or reconciliation you are on
â€¢ Matches each check to its QuickBooks transaction and shows why (number, date, amount, payee)
â€¢ Marks the check as cleared in the QuickBooks reconciliation when you approve it
â€¢ "Approve clean matches": approve every exact match at once, after a list you confirm
â€¢ Fix a discrepancy (wrong amount or payee) and push the correction to QuickBooks
â€¢ Auto-approve rules you control: which fields must agree, exact amount, minimum score
â€¢ Upload bank statements and check images from the side panel
â€¢ Works across multiple QuickBooks Online companies and bank accounts

WHAT IT DOES NOT DO

â€¢ It never clears a check you have not approved. Bulk approval only includes exact matches
  with no amount difference, and lists each check for you to confirm first.
â€¢ It only changes an amount or payee in QuickBooks when you edit and save that one
  transaction yourself.
â€¢ It runs only on QuickBooks (intuit.com) pages and does nothing on any other site.

WHO IT IS FOR

Accounting firms, bookkeepers and businesses that reconcile many checks in QuickBooks
Online: construction, property management, churches and nonprofits.

REQUIREMENTS

A Kyriq account and a connected QuickBooks Online company. Start a free trial at
https://kyriq.com. The extension is included with every plan at no extra cost.

LEARN MORE / SUPPORT

https://kyriq.com/features/quickbooks-chrome-extension  Â·  https://kyriq.com/support
```

**Official URL / Homepage URL** (the extension's own feature page, so the listing and the
site reinforce the same keywords; requires the domain to be verified in Search Console)
```
https://kyriq.com/features/quickbooks-chrome-extension
```

**Support URL**
```
https://kyriq.com/support
```

**Mature content**: No.

### Graphic assets

| Asset | Required | File |
|---|---|---|
| Store icon 128Ã—128 | yes | `chrome-extension/store-assets/store-icon-128.png` âœ… ready |
| Screenshot 1280Ã—800 | **yes, at least one** | âš ï¸ **must be captured by hand â€” see below** |
| Small promo tile 440Ã—280 | optional | `chrome-extension/store-assets/small-promo-tile-440x280.png` âœ… ready |
| Marquee promo tile 1400Ã—560 | optional | `chrome-extension/store-assets/marquee-promo-tile-1400x560.png` âœ… ready |

Both tiles are RGB PNGs with **no alpha channel** â€” a transparent PNG is the usual reason a tile
upload is refused. Rebuild them with `python chrome-extension/store-assets/build_tiles.py`.

#### The screenshot has to be taken from the running extension

It cannot be generated. The side panel's entire contents are built at runtime from `chrome.storage`
and `chrome.runtime` messages; loaded outside the extension it renders blank. Anything produced
without the extension running would be a mockup, and a store screenshot that does not match the
product is itself grounds for rejection or later removal.

To capture it:

1. Load the unpacked extension (`chrome://extensions` â†’ Developer mode â†’ Load unpacked â†’
   `chrome-extension/`).
2. Sign in to Kyriq and connect a **QuickBooks sandbox** company â€” never a real client file. The
   screenshot is public forever.
3. Open a QuickBooks register with a few matched checks, open the Kyriq side panel.
4. Set the window to exactly 1280Ã—800 before capturing. In DevTools: Device Toolbar â†’ Responsive â†’
   type `1280` Ã— `800`, zoom 100%, then capture.
5. Save as 24-bit PNG or JPEG, **no alpha**.

Good first screenshot: the side panel open beside a QuickBooks register, with one match visible and
its confidence shown. That is the single frame that explains the product.

---

## 2. Privacy

**Single purpose description**
```
Kyriq reconciles paper checks against QuickBooks Online. Inside QuickBooks register and
reconcile pages, the extension shows the user's checks alongside the matching QuickBooks
transactions and, when the user approves a match, marks that transaction as cleared in
QuickBooks. Everything the extension does serves that one purpose.
```

### Permission justifications

Each of these has code behind it; 1.0.1 removed the two that did not.

**storage**
```
Stores the signed-in user's Kyriq session so the side panel does not ask them to log in
again on every page, caches the checks and match results shown in the panel so switching
QuickBooks tabs does not refetch them, and keeps the user's own display preferences such as
date format and overlay mode. All of it is stored locally in the browser profile.
```

**tabs**
```
The extension works against the QuickBooks tab the user is looking at. It queries for tabs
on intuit.com so the side panel can show the checks relevant to the company and register
currently open, sends messages to that tab's content script to highlight and clear a
matched transaction, and opens a tab for the QuickBooks authorization page when the user
connects a company. It does not read browsing history or the contents of any non-QuickBooks
tab.
```

**alarms**
```
A single alarm runs every five minutes to refresh the number shown on the extension's
toolbar badge â€” how many checks are waiting for the user's review. Without it the badge
would only update while the side panel happened to be open.
```

**sidePanel**
```
The extension's entire interface is a side panel, so it can sit beside the QuickBooks
register the user is reconciling instead of covering it. This permission opens that panel
when the user clicks the toolbar icon.
```

**Host permission**
```
Each host is one service the extension must talk to, and nothing broader:

â€¢ quickbooks.api.intuit.com â€” read the user's QuickBooks transactions and mark approved
  ones cleared. This is the integration itself.
â€¢ kyriq.com â€” the user's own Kyriq account: sign-in, their checks and match results, and the
  server-side exchange of QuickBooks OAuth tokens (done on the server so the client secret
  is never in the extension).
â€¢ yqbmzerdagqevjdwhlwh.supabase.co â€” the Kyriq database that stores that user's checks and
  matches.
â€¢ check-extractor-production-2026.up.railway.app â€” the Kyriq service that processes uploaded
  check images. Text extraction happens on that server; the extension holds no AI provider
  key and calls no AI provider directly.

The content script runs only on https://*.intuit.com/*, which is where the user's
QuickBooks register lives. The extension does nothing on any other website.
```

**Are you using remote code?** â†’ **No, I am not using Remote code**

> Verified: all three extension pages load only scripts inside the package, and there is no `eval`,
> no `new Function` and no dynamic `import()` of a URL anywhere. *(Separately: the three stylesheets
> `@import` the Inter font from Google Fonts. That is remote CSS, not remote code, so the answer
> stays No â€” but it should be self-hosted, since under MV3's CSP it may silently fail and it pings
> Google on every panel open.)*

### Data usage â€” tick all five

| Category | Why |
|---|---|
| â˜‘ **Personally identifiable information** | The account email, and payee names read from the register |
| â˜‘ **Financial and payment information** | Check images, amounts, check numbers, and QuickBooks transaction data |
| â˜‘ **Authentication information** | The Kyriq session and QuickBooks OAuth tokens, held in `chrome.storage.local` |
| â˜‘ **Website content** | The content script reads the QuickBooks register DOM to find the row to clear |
| â˜‘ **User activity** | Which matches the user approved, and usage against their plan allowance |

Leave unticked: health, location, web history, personal communications â€” none apply.

> Tick **Website content**. It is tempting to skip because it sounds broad, but the extension does
> read page content on intuit.com, and under-disclosure is itself a rejection cause.

**Certify all three**: â˜‘ no selling/transferring outside approved use cases Â· â˜‘ no unrelated use Â·
â˜‘ no creditworthiness use. All three are true of Kyriq.

**Privacy policy URL**
```
https://kyriq.com/privacy
```
Verified live and publicly reachable (HTTP 200).

The policy states what the code does: uploaded PDFs and cropped cheque images are stored in
Supabase Storage (`checks` bucket, `jobs/{job_id}/`); a daily Vercel cron (`/api/retention/sweep`)
deletes the uploaded PDF 14 days after the reconciliation completes (migration 035); cheque images
and extracted data stay until the user deletes the job or closes the account. Server-side
processors named: Google Gemini, OpenAI (fallback), Hugging Face (NuMarkdown), Railway, Supabase,
Vercel, Intuit. As of 1.2.0 the extension itself sends nothing to Google or any AI provider.
Before submitting, confirm migration 035 is applied in production so the 14-day sweep is live.

---

## 3. Distribution

- **Payments**: **Free of charge**. The extension is free; a Kyriq subscription is billed in the web
  app, which is not an in-app purchase for store purposes.
- **Visibility**: **Public**
- **Distribution**: **All regions**

---

## 4. Test instructions

Reviewers cannot see anything without an account, so this field decides whether the review succeeds.

**You must create the account** â€” a dedicated reviewer login on kyriq.com, connected to a QuickBooks
**sandbox** company, never a real client file. Enter the username and password into the dashboard
yourself.

**Additional instructions** (500 char limit â€” this fits):
```
1. Sign in at chrome://extensions after loading Kyriq, then click the Kyriq toolbar icon to
open the side panel and sign in with the credentials above.
2. The account already has sample checks and a connected QuickBooks sandbox company.
3. Go to https://qbo.intuit.com and open any account register.
4. The Kyriq panel lists checks matched to transactions on that register.
5. Click Approve on a match â€” Kyriq marks that one transaction cleared in QuickBooks.
No other site is affected; the extension only runs on intuit.com.
```

---

## 5. Packaging

```bash
cd chrome-extension
node check-parity.mjs     # must print 11 checks passed
```

Then build the store zip. The packager drops localhost hosts, narrows Railway to Kyriq's own
backend, removes unused permissions, and leaves out docs, the parity script and the unmounted popup:

```bash
python chrome-extension/package_store.py   # writes dist/kyriq-extension-1.2.6.zip
```

Upload that zip to the existing item `apnglhjejjghgmcinkoeganejmkjmkpk` as a new package, fill the
forms above, add a real 1280x800 screenshot of the running side panel with demo data (not the
concept boards in docs/premium-redesign), and stop at the review screen. The owner presses Submit.

### Before you submit, confirm by hand

Removing a permission that was quietly load-bearing fails silently, so exercise it:

- [ ] Sign in through the side panel
- [ ] The badge shows a count
- [ ] The overlay appears on a QuickBooks register
- [ ] Approving one match clears exactly one row
- [ ] `chrome://extensions` shows no manifest warnings
