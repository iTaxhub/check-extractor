# Chrome Web Store submission — Kyriq

Every field, ready to paste. Written against what the code actually does, not marketing copy.

- **Item ID**: `apnglhjejjghgmcinkoeganejmkjmkpk` (confirmed by the owner, 19 Oct 2026; the older ID `acmmjfmlpemmigbbpkohebaehnofcdkg` is not the one to update)
- **Package to upload**: version **1.2.0**, `dist/kyriq-extension-1.2.0.zip` built by `python chrome-extension/package_store.py`
- **Status**: Draft, never submitted

> **Do not copy from `chrome-extension/WEB-STORE-SUBMISSION.md`.** It is stale and will get the
> submission rejected: it justifies `activeTab` (not in the manifest) and `identity` / `notifications`
> (removed in 1.0.1 because nothing used them), omits `tabs`, `alarms` and `sidePanel` entirely,
> claims "98.7% accuracy" — an unsubstantiated performance claim — quotes a $300/year price that is
> not current, and every URL in it is a `yourcompany.com` placeholder. This file supersedes it.

---

## 1. Store listing

**Title** *(from package, read-only)*
```
Kyriq
```

**Summary** *(from package, read-only)*
```
Check reconciliation for QuickBooks Online: match your checks to transactions and clear approved ones without leaving QuickBooks.
```

**Category**: `Workflow & Planning`
**Language**: `English (United States)`

**Description**

```
Kyriq reconciles paper checks against QuickBooks Online.

Upload a bank statement or a sheet of scanned checks and Kyriq reads each one — check
number, date, amount and payee — then compares it against the transactions in your
QuickBooks Online company. You review what it found, approve the matches you agree with,
and Kyriq marks those transactions as cleared directly inside QuickBooks.

This extension is the part that works inside QuickBooks. It adds a side panel and an
on-page overlay to your QuickBooks register and reconcile screens, so approving a match and
clearing it happen where you are already working, instead of in a separate tab you have to
keep switching to.

WHAT IT DOES

• Shows your Kyriq checks beside the QuickBooks register you are looking at
• Highlights the QuickBooks transaction that matches a check, with its confidence
• Clears a transaction in QuickBooks when you approve the match — one click, one row
• Keeps a badge count of checks still waiting for review
• Works across multiple QuickBooks companies

WHAT IT DOES NOT DO

• It never clears anything you have not approved. A single approval affects one row; the
  bulk option approves only matches at 95% confidence or higher, shows the count, and asks
  you to confirm first.
• It only edits an amount, payee or date in QuickBooks when you choose Fix on a discrepancy
  you are reviewing, and only on that row.
• It runs only on QuickBooks (intuit.com) pages. It does nothing on any other site.

REQUIREMENTS

A Kyriq account and a connected QuickBooks Online company. Sign up at https://kyriq.com —
the extension is included with every plan and with the trial, at no extra cost.

SUPPORT

https://kyriq.com  ·  support@kyriq.com
```

**Official URL / Homepage URL**
```
https://kyriq.com
```

**Support URL**
```
https://kyriq.com
```

**Mature content**: No.

### Graphic assets

| Asset | Required | File |
|---|---|---|
| Store icon 128×128 | yes | `chrome-extension/store-assets/store-icon-128.png` ✅ ready |
| Screenshot 1280×800 | **yes, at least one** | ⚠️ **must be captured by hand — see below** |
| Small promo tile 440×280 | optional | `chrome-extension/store-assets/small-promo-tile-440x280.png` ✅ ready |
| Marquee promo tile 1400×560 | optional | `chrome-extension/store-assets/marquee-promo-tile-1400x560.png` ✅ ready |

Both tiles are RGB PNGs with **no alpha channel** — a transparent PNG is the usual reason a tile
upload is refused. Rebuild them with `python chrome-extension/store-assets/build_tiles.py`.

#### The screenshot has to be taken from the running extension

It cannot be generated. The side panel's entire contents are built at runtime from `chrome.storage`
and `chrome.runtime` messages; loaded outside the extension it renders blank. Anything produced
without the extension running would be a mockup, and a store screenshot that does not match the
product is itself grounds for rejection or later removal.

To capture it:

1. Load the unpacked extension (`chrome://extensions` → Developer mode → Load unpacked →
   `chrome-extension/`).
2. Sign in to Kyriq and connect a **QuickBooks sandbox** company — never a real client file. The
   screenshot is public forever.
3. Open a QuickBooks register with a few matched checks, open the Kyriq side panel.
4. Set the window to exactly 1280×800 before capturing. In DevTools: Device Toolbar → Responsive →
   type `1280` × `800`, zoom 100%, then capture.
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
toolbar badge — how many checks are waiting for the user's review. Without it the badge
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

• quickbooks.api.intuit.com — read the user's QuickBooks transactions and mark approved
  ones cleared. This is the integration itself.
• kyriq.com — the user's own Kyriq account: sign-in, their checks and match results, and the
  server-side exchange of QuickBooks OAuth tokens (done on the server so the client secret
  is never in the extension).
• yqbmzerdagqevjdwhlwh.supabase.co — the Kyriq database that stores that user's checks and
  matches.
• check-extractor-production-2026.up.railway.app — the Kyriq service that processes uploaded
  check images. Text extraction happens on that server; the extension holds no AI provider
  key and calls no AI provider directly.

The content script runs only on https://*.intuit.com/*, which is where the user's
QuickBooks register lives. The extension does nothing on any other website.
```

**Are you using remote code?** → **No, I am not using Remote code**

> Verified: all three extension pages load only scripts inside the package, and there is no `eval`,
> no `new Function` and no dynamic `import()` of a URL anywhere. *(Separately: the three stylesheets
> `@import` the Inter font from Google Fonts. That is remote CSS, not remote code, so the answer
> stays No — but it should be self-hosted, since under MV3's CSP it may silently fail and it pings
> Google on every panel open.)*

### Data usage — tick all five

| Category | Why |
|---|---|
| ☑ **Personally identifiable information** | The account email, and payee names read from the register |
| ☑ **Financial and payment information** | Check images, amounts, check numbers, and QuickBooks transaction data |
| ☑ **Authentication information** | The Kyriq session and QuickBooks OAuth tokens, held in `chrome.storage.local` |
| ☑ **Website content** | The content script reads the QuickBooks register DOM to find the row to clear |
| ☑ **User activity** | Which matches the user approved, and usage against their plan allowance |

Leave unticked: health, location, web history, personal communications — none apply.

> Tick **Website content**. It is tempting to skip because it sounds broad, but the extension does
> read page content on intuit.com, and under-disclosure is itself a rejection cause.

**Certify all three**: ☑ no selling/transferring outside approved use cases · ☑ no unrelated use ·
☑ no creditworthiness use. All three are true of Kyriq.

**Privacy policy URL**
```
https://kyriq.com/privacy
```
Verified live and publicly reachable (HTTP 200).

> ⚠️ **Owner decision before submitting.** The live policy says images are processed in memory and
> not stored unless the user opts in, while the source describes retained documents and images.
> State the true retention behaviour, publish it, and name the server-side processors (Google
> Gemini, Railway). As of 1.2.0 the extension itself no longer calls Gemini or holds its key.

---

## 3. Distribution

- **Payments**: **Free of charge**. The extension is free; a Kyriq subscription is billed in the web
  app, which is not an in-app purchase for store purposes.
- **Visibility**: **Public**
- **Distribution**: **All regions**

---

## 4. Test instructions

Reviewers cannot see anything without an account, so this field decides whether the review succeeds.

**You must create the account** — a dedicated reviewer login on kyriq.com, connected to a QuickBooks
**sandbox** company, never a real client file. Enter the username and password into the dashboard
yourself.

**Additional instructions** (500 char limit — this fits):
```
1. Sign in at chrome://extensions after loading Kyriq, then click the Kyriq toolbar icon to
open the side panel and sign in with the credentials above.
2. The account already has sample checks and a connected QuickBooks sandbox company.
3. Go to https://qbo.intuit.com and open any account register.
4. The Kyriq panel lists checks matched to transactions on that register.
5. Click Approve on a match — Kyriq marks that one transaction cleared in QuickBooks.
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
python chrome-extension/package_store.py   # writes dist/kyriq-extension-1.2.0.zip
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
