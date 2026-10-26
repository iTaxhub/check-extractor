# Kyriq SEO Master Plan

_Last updated: 2026-10-26. Owner: James Epale._

## Summary

kyriq.com ranks for almost nothing because it is effectively **one indexable page**:
- Crawlers can't read `robots.txt` or `sitemap.xml`; both redirect to `/login`.
- There are no canonicals and no structured data.
- The words people actually search for barely appear in the copy: "QuickBooks checks", "QBO", "cheque", "uncleared checks", "check OCR".

**The opportunity:** every competitor stops at *extracting or importing* checks. Nobody sells **matching and clearing checks inside QuickBooks Online**. Many Intuit Community threads ("checks not showing as cleared", "uncleared checks") end in "do it manually" or "find a third-party app". That is the slot Kyriq should own.

**Strategic decisions**

| Decision | Choice |
|---|---|
| Positioning | **Reconcile-first.** Match and clear checks inside QBO. OCR and handwritten extraction are supporting features. |
| Spelling | **US "check" sitewide, plus dedicated "cheque" pages** for Canada and the UK. Legal, email and Stripe copy that currently says "cheque" gets normalised to "check". |
| Tooling | [claude-seo](https://github.com/AgriciDaniel/claude-seo), installed as a Claude Code plugin, using only its free commands. The paid DataForSEO extension stores credentials in plaintext, so skip it. |

---

## 1. Audit findings

Verified against the code and the live site on 2026-10-26.

### Critical

| # | Finding | Evidence |
|---|---|---|
| C1 | `/robots.txt` and `/sitemap.xml` return **307 → `/login`**. Neither file exists, and the auth proxy would block them even if they did. | `frontend/proxy.ts:16` matcher runs on every non-image path. `frontend/lib/supabase/proxy.ts:39-57` `publicRoutes` doesn't list them. |
| C2 | **Only one indexable page.** Pricing, features, the extension and the FAQ are `#anchors` on `/`. Any new marketing route also bounces to login until it is added to `publicRoutes`. | `components/landing/LandingPage.tsx`. Live `/pricing` and `/blog` both return 307 to login. |
| C3 | **Auth pages duplicate the homepage.** `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/invite/*`, `/mfa`, `/qb-oauth-complete` and the 404 inherit the home title and description and are indexable. | They are client components with no metadata and no `noindex`. |

### High

| # | Finding | Evidence |
|---|---|---|
| H1 | No title template, `alternates.canonical`, `robots` or `verification` in the root metadata. | `frontend/app/layout.tsx:27-54` |
| H2 | **No JSON-LD at all**, although the sources exist: 15 FAQs and the pricing plans. | `LandingPage.tsx:733-794`, `lib/pricing.ts` (`PLANS`) |
| H3 | **The H1 has no keyword.** It reads "See every check. Approve exact matches together." Several search terms are missing or rare on the page (counts below). | `LandingPage.tsx` |
| H4 | **No analytics, no Search Console or Bing verification.** Search Console also blocks the Chrome Web Store official-URL step. | `CHECKLIST.md:659`, `docs/STATUS.md:104` |
| H5 | **Spelling is mixed.** `/support`, `/privacy`, `/legal/eula`, emails and Stripe products say "cheque"; the landing page and `/terms` say "check". | `lib/email/templates.ts:88`, `scripts/provision-stripe.ts:214` |

Keyword counts for H3, in `LandingPage.tsx`:

| Term | Mentions |
|---|---|
| "QBO" | 1 |
| "OCR" | 0 |
| "cheque" | 0 |
| "deposit" | 0 |
| "uncleared" | 0 |

### Medium

| # | Finding |
|---|---|
| M1 | **Slow first paint.** The landing page is `'use client'` and ships framer-motion for the mobile menu alone. The hero H1 starts at opacity 0 (`animate-glass-rise`), which can delay LCP. |
| M2 | **Extra latency on public pages.** The proxy calls `supabase.auth.getUser()` (a network round-trip) for `/` and the legal pages, which adds TTFB. |
| M3 | **Temporary redirects.** `/legal/privacy` and `/legal/terms` use `redirect()`, a 307. `www` → apex is also a 307. Both should be 308s. |
| M4 | **Internal links.** The footer doesn't link `/support` or `/legal/eula`. The Chrome Web Store link only renders when `NEXT_PUBLIC_CHROME_EXTENSION_URL` is set, and it isn't. |
| M5 | **Images.** 7 of 11 imgs have empty alt text (some are correctly decorative). `match-review-dashboard-4k-v1.webp`, `closing-cta-ribbons-4k-v1.webp` and `public/integrations/*.svg` are unused. No AVIF output is configured. |
| M6 | **Chrome extension listing.** The manifest `name` is just "Kyriq"; use "Kyriq – QuickBooks Check Reconciliation". The store docs say 1.2.1, but the manifest is 1.2.4. |
| M7 | **Icons.** `icons.apple` points at an SVG, which iOS ignores, but `app/apple-icon.png` already exists, so drop the override. There is no web app manifest. |

---

## 2. Competitive landscape

| Competitor | Positioning | SEO playbook | Threat |
|---|---|---|---|
| **DocuClipper** | OCR for bank statements, checks and invoices, into QBO, Xero or Excel | Programmatic `/features`, `/solutions`, `/comparisons/*-alternative` and `/industries` pages, plus a blog. Ranks itself #1 for "best check OCR software". | **High.** The main SEO rival. |
| **SaasAnt Transactions** | Bulk import, export and delete for QBO | Owns "import checks into QuickBooks". Region-specific support articles (US, UK, AU, CA). Has a "QuickBooks check scanner alternative" page. | High for the import keywords |
| **Dancing Numbers** | QB import and export | A high-volume QB how-to blog: clearing outstanding checks, uncleared transactions | Medium |
| **Lido** | OCR into spreadsheets | `/lp/check-ocr`, plus "best OCR for bookkeeping" listicles | Medium |
| **Parseur** | Document parser | `/extract-data/cheque`, using the "cheque" spelling | Medium for the cheque terms |
| **Nanonets** | Enterprise document processing | QBO tutorials that pull in top-of-funnel traffic | Low to medium |
| **Dext / Hubdoc** | Pre-accounting | Mostly brand searches. Their "alternative" keywords are open. | Opportunity |
| **Veryfi / FormX** | OCR APIs | Free "image to Excel" tools | Shows the free-tool play works |
| **MoneyThumb, PDF-to-QBO** | PDF → QBO converters | One product page per format | Low |

### What the search results look like

- **Intuit dominates the how-to results.** That includes help articles (with separate en-us, en-ca and en-uk copies) and Community threads.
- **The competition for how-to queries is weak.** Thin or stale sites rank (Cleverence, Chron, TeachUcomp), and the Intuit threads go out of date.
- **Commercial results are vendor pages.** Capterra, G2 and GetApp take the "alternative" queries.
- **No YouTube videos target outstanding or uncleared checks.** That slot is open.

---

## 3. Keyword targets

Volumes and difficulty are estimates from SERP makeup. Validate them with `/seo cluster` and Google Keyword Planner (`/seo google`) before you commit content effort. **Bold** = realistic for a new domain now.

| Cluster | Keywords |
|---|---|
| **Core commercial** | **check reconciliation quickbooks online**, check reconciliation software, **scan checks into quickbooks online**, quickbooks check scanner, **bulk check processing quickbooks**, **handwritten check OCR**, **cheque OCR software**, check MICR reader software |
| **QBO how-to and problems** | how to clear checks in quickbooks online, uncleared checks quickbooks online, outstanding checks quickbooks online, **checks not showing as cleared in quickbooks**, **how to mark a check as cleared**, **match checks to bank feed quickbooks**, **how to record handwritten checks in quickbooks**, **quickbooks check scanner not working**, import checks into quickbooks online |
| **Cheque (CA/UK)** | **cheque reconciliation quickbooks**, **outstanding cheques quickbooks**, **import cheques into quickbooks online**, **cheque data extraction**, **cheque to excel**, cheque scanning software canada, bank reconciliation software canada |
| **Alternatives** | **docuclipper alternative**, **saasant alternative**, **quickbooks check scanner alternative**, dext alternative, hubdoc alternative, best check OCR software |
| **Free tools** | **check image to csv**, **cheque image to excel**, **MICR line reader online**, **outstanding check list template**, check register template excel |
| **Firm audience** | bank reconciliation software for accounting firms, **QBOA reconciliation multiple clients**, **how to speed up bank reconciliation**, month end close checklist bookkeeping |
| **Verticals** | **check reconciliation for property management / churches / nonprofits / construction / medical billing** |
| _Skip for now_ | how to reconcile in quickbooks online, undeposited funds, pdf to qbo converter, bank statement to QBO converter. Intuit, NerdWallet and DocuClipper own these. |

---

## 4. The plan

### Phase 1: technical foundation (1–2 days, highest ROI)

1. **Robots and sitemap.**
   - Add `frontend/app/robots.ts`. It allows `/`, disallows the app and auth routes, and references the sitemap.
   - Add `frontend/app/sitemap.ts`, generated from a single `lib/marketing/routes.ts` list.
   - Exempt `robots.txt`, `sitemap.xml`, `manifest.webmanifest` and `opengraph-image` in the `proxy.ts` matcher.
2. **One route list.** Make that marketing route list the single source for both `publicRoutes` and the sitemap, so new pages can't silently bounce to login. Skip `supabase.auth.getUser()` for public marketing paths.
3. **Root metadata.**
   - `title: { default, template: '%s | Kyriq' }`
   - `alternates.canonical` on every public page
   - `verification.google`
   - a description containing the keywords
4. **Noindex.** Add server `layout.tsx` files with `robots: { index: false }` and distinct titles for `(auth)`, `invite`, `mfa`, `qb-oauth-complete` and `not-found`.
5. **JSON-LD.** Write one small `<JsonLd>` server component.
   - Organization and WebSite go in the root layout.
   - SoftwareApplication with Offers is built from `PLANS`.
   - FAQPage is built from the FAQ array, extracted to a shared const so the page and the schema can't drift apart.
6. **Redirects.**
   - Legal redirects become `permanentRedirect()`.
   - `www` → apex becomes a 308 in the Vercel domain settings.
7. **Measurement.**
   - Verify Search Console via metadata and submit the sitemap.
   - Set up Bing Webmaster and IndexNow (`/seo bing`).
   - Add GA4 or Plausible.
8. **Assets.**
   - Drop the SVG `icons.apple` override.
   - Fix meaningful alt text.
   - Delete the unused images.
   - Set `images.formats: ['image/avif', 'image/webp']`.
9. **Hero.**
   - H1 becomes, for example, "Check reconciliation for QuickBooks Online: match and clear every check". The current slogan becomes the subhead.
   - Remove the opacity-0 start.
   - Work "QBO", "OCR" and "uncleared" into the body copy and the FAQ naturally.
10. **Spelling.** Normalise `/support`, `/privacy`, `/legal/eula`, the email templates and the Stripe product text to "check".
11. **Chrome extension.** Set the manifest name to "Kyriq – QuickBooks Check Reconciliation" and sync the store docs to version 1.2.4.

### Phase 2: core commercial pages

**How they're built.**
- One server-rendered template plus typed TypeScript content files. No new dependency; MDX isn't installed.
- **Slugs must avoid the app routes** `/reconcile`, `/reconciliation`, `/review`, `/upload`, `/export`, `/history` and `/reports`.
- Every page needs:
  - a unique title and description
  - a canonical
  - an FAQ block with FAQPage schema
  - a BreadcrumbList
  - links to `/pricing` and `/signup`

| URL | Main keyword |
|---|---|
| `/pricing` | check reconciliation software pricing |
| `/features/check-reconciliation-quickbooks-online` | check reconciliation quickbooks online |
| `/features/handwritten-check-ocr` | handwritten check OCR |
| `/features/bulk-check-processing` | bulk check processing quickbooks |
| `/chrome-extension` | clear checks in quickbooks (chrome extension) |
| `/for/accounting-firms` | bank reconciliation software for accounting firms |
| `/for/bookkeepers` | QBOA reconciliation multiple clients |
| `/ca/cheque-reconciliation-quickbooks` | cheque reconciliation quickbooks (en-CA, CAD context) |
| `/uk/cheque-reconciliation-quickbooks` | cheque reconciliation quickbooks (en-GB, GBP context) |
| `/integrations/*` | only for export formats the backend actually returns from `/api/export-formats`. Verify first. |

The CA and UK pages need genuinely localised copy, not a find-and-replace. Connect them with `hreflang` pairs (`en-US` / `en-CA` / `en-GB`).

### Phase 3: comparison pages

| URL | Angle |
|---|---|
| `/compare/docuclipper-alternative` | DocuClipper extracts; Kyriq extracts, matches **and clears** in QBO |
| `/compare/saasant-alternative` | SaasAnt imports; Kyriq reconciles |
| `/compare/quickbooks-check-scanner-alternative` | Covers the QB native scanner's limits (duplicates, "not working") |
| `/compare/dext-alternative` | Dext has no check-image reconciliation |
| `/compare/hubdoc-alternative` | Hubdoc is Xero-first and receipt-focused |

**Rules for comparison pages.**
- Every claim must be factual, sourced and dated in a "last verified" line.
- Use competitor names nominatively only, with no logos.
- Re-check the competitor pages every quarter.

### Phase 4: how-to content hub (`/guides/*`, two posts a week)

Start with the topics where Intuit Community answers are weak or stale:

1. Checks not showing as cleared in QuickBooks Online: causes and fixes
2. How to clear outstanding and uncleared checks in QBO (including 500 at once)
3. How to mark a check as cleared in QuickBooks Online
4. How to match checks to the bank feed in QBO
5. How to record handwritten checks in QuickBooks
6. QuickBooks check scanner not working: fixes and alternatives
7. How to import checks into QuickBooks Online
8. Cheque versions of 1–3 for Canada and the UK

**Every guide includes:**
- current QBO screenshots
- a 2–4 minute YouTube video with the same title, embedded in the post
- FAQPage schema
- a link to the matching Phase 2 page
- an author byline with credentials (E-E-A-T)

### Phase 5: free tools and lead magnets (earning links)

| Asset | Cost | Notes |
|---|---|---|
| Outstanding-checks list template (Excel and Google Sheets) | None | Lead magnet |
| Check register template (Excel) | None | Targets "check register template excel" |
| MICR line decoder | None | Runs entirely in the browser |
| "Check image to CSV" demo (5 checks, rate-limited, captcha) | Gemini API | **Only after a cost and abuse review** |

### Phase 6: off-site and distribution

- **Chrome Web Store.** Publish the listing with a keyword-rich name and description, then set `NEXT_PUBLIC_CHROME_EXTENSION_URL` so the site links to it.
- **QuickBooks App Store listing.** Use the keywords in `docs/quickbooks-production/APP-DESCRIPTIONS.md`.
- **Review sites.** Capterra, G2 and GetApp profiles. Ask the first customers for reviews.
- **Communities.** Post genuinely helpful answers in Intuit Community and r/QuickBooks, linking to the guides. No spam.
- **Vertical pages, on the Phase 2 template.** Property management, churches and nonprofits, construction, medical billing.
- **AI search readiness.** Run `/seo geo` and `/seo agentic`, add `llms.txt`, and keep the FAQ answers short and quotable.

### Phase 7: monitoring

- `/seo drift baseline` right after Phase 1 ships, then `/seo drift compare` every month.
- A monthly Search Console review covering queries, pages, coverage errors and Core Web Vitals.
- `/seo google` PDF reports each quarter.

| KPI | Target |
|---|---|
| Indexed pages | ≥ 30 by month 3 |
| Top-10 rankings | ≥ 15 bold (realistic) keywords by month 6 |
| Organic signups | Tracked in GA4 from Phase 1 |

---

## 5. Files the implementation touches

- `frontend/proxy.ts`: matcher exemptions
- `frontend/lib/supabase/proxy.ts`: public route list, and skipping `getUser()` on marketing paths
- `frontend/app/layout.tsx`: metadata and JSON-LD
- `frontend/components/landing/LandingPage.tsx`: H1, copy, FAQ extraction
- `frontend/lib/pricing.ts`: source of the Offers
- `frontend/app/(auth)/layout.tsx`: noindex
- `frontend/next.config.js`: image formats and redirects
- `chrome-extension/manifest.json`: store name
- New:
  - `frontend/app/robots.ts`
  - `frontend/app/sitemap.ts`
  - `frontend/lib/marketing/routes.ts`

## 6. Verification checklist (Phase 1)

- [ ] `cd frontend && npm run type-check && npm run lint && npm run build` passes
- [ ] `curl -I https://<preview>/robots.txt` and `/sitemap.xml` → **200**, not 307
- [ ] `/login` HTML contains `<meta name="robots" content="noindex">`
- [ ] Google Rich Results Test validates FAQPage and SoftwareApplication on `/`
- [ ] Search Console accepts the sitemap, and coverage shows the marketing pages
- [ ] `/legal/privacy` → 308

---

## 7. claude-seo audit results

**Setup.** claude-seo v2.5.0 is installed as a Claude Code plugin (`claude-seo@agricidaniel-claude-seo`). `/seo setup` finished, and `claude-seo doctor` reports the runtime and Chromium as ready.

**Baseline.** Run against the live https://kyriq.com on 2026-10-26, before any of this work deployed. The scripts were run directly, so these are not the full `/seo audit` agent run. The plugin loads in new sessions, so run `/seo audit https://kyriq.com` after deploy for the full report.

| Check | Result |
|---|---|
| `sitemap_discovery` | **No valid sitemap found**. This confirms C1. |
| `parse_html` (home, as Googlebot) | Canonical: **none**. Schema blocks: **0**. H1: 1. H2: 7. 1,503 words. 14 internal links. |
| `agentic_check` P1 | **fail** on llms.txt: `/llms.txt` answers 200 with HTML, a catch-all. |
| `agentic_check` P1 | **fail** on ai-catalog.json: `/.well-known/ai-catalog.json` also answers 200 with HTML. |
| `agentic_check` P1 | **warn**: unknown URLs return 200, a soft 404. Signed-out requests to unknown paths are redirected to `/login`, which answers 200. |
| `agentic_check` P2/P3 | **warn** on the API catalog, OAuth metadata, A2A card and UCP profile: all answer HTML with 200. Same cause. |

The last three rows were new findings, and they are fixed on this branch:
- **The proxy matcher** now skips `/.well-known/*` and `*.json`, so those get Next's real 404.
- **`public/llms.txt`** now exists.
- **Unknown app-like paths** still redirect to `/login`, which is standard for a SaaS app. `/login` is now `noindex`, so the redirect can't create indexed soft-404 pages.

---

### open-seo audit rules, applied

[open-seo](https://github.com/every-app/open-seo) is a self-hostable Semrush/Ahrefs alternative. It needs a paid DataForSEO key for keyword, SERP and Lighthouse data, so it isn't installed. The useful part is its rule set:
- **Site-audit thresholds** (`src/server/lib/audit/issues/page-reporters.ts`):
  - Title 10–60 characters
  - Meta description 70–160 characters
  - Exactly one H1
  - At least 150 words
  - No skipped heading levels
  - `alt` on every image
  - No broken internal links and no orphan pages
  - HTML response under 1,500 ms
  - At most one redirect hop

**What I did with them**
- **Local crawl.** I crawled every sitemap URL of a local production build against those rules. The crawl script is in the session scratchpad.
- **Fixes:**
  - Titles over 60 characters now drop the "| Kyriq" suffix.
  - Seven descriptions over 160 characters were tightened.
  - A footer `h4` caused an h2→h4 skip; it is now a `p`.
  - The index pages gained ItemList JSON-LD.
  - The legal and support pages were rendering a double "| Kyriq | Kyriq" title and had no canonical; both are fixed.
- **`scripts/check-marketing.ts`** now enforces the 60-character title and 70–160 description limits.

**Result:**
- 35 URLs and 44 internal links.
- 0 broken links, 0 orphan pages, 0 title or description violations, 0 heading skips.
- Every page has one H1 and a self-canonical.

**Accepted**
- The legal pages carry no JSON-LD. They don't need it.
- `/support` is 124 words, under the 150-word bar. Expand it when real support content exists.

**Method to keep using** (from open-seo's skills)
- **Build order by intent "temperature":**
  - Hot first: vs, pricing and alternatives pages.
  - Then warm: use-case pages.
  - Then cold: informational guides.
- **Keyword clusters:** cluster by SERP overlap, with one cluster per URL.
- **Search Console:** once it's connected, start with "striking distance" queries: position 5–20 with at least 50 impressions.
- **AI search:**
  - Keep `OAI-SearchBot`, `PerplexityBot` and `ClaudeBot` allowed. `robots.ts` allows all bots.
  - Track 10–15 neutral prompts for gaps where competitors get cited and Kyriq doesn't.
  - Listicles are the most-cited format, so pursue inclusion in "best check OCR / reconciliation software" lists.

---

## 8. Implementation status (branch `seo/master-plan`)

### Done

**Phase 1: technical foundation**
- **Robots and sitemap.**
  - `app/robots.ts` and `app/sitemap.ts` are generated from `lib/marketing/routes.ts`, the single list of public paths, and from the content files.
  - The proxy skips static and metadata files, and skips the Supabase `getUser()` call on every marketing path.
- **Root metadata.**
  - Title template `%s | Kyriq`, a keyword-bearing description, and Google and Bing verification via environment variables.
  - The SVG apple-icon override is removed.
  - The canonical is set per page; it is deliberately not set at the root, where every page would inherit it.
- **Noindex.** `noindex` on `(auth)`, `/invite`, `/mfa` and `/qb-oauth-complete`.
- **JSON-LD.**
  - Home: Organization, WebSite, SoftwareApplication (Offers built from `PLANS`) and FAQPage (from the approved 15 FAQs, moved unchanged to `lib/marketing/faqs.ts`).
  - Every content page: Article or WebPage, BreadcrumbList and FAQPage.
- **Redirects.** `/legal/privacy` and `/legal/terms` now use `permanentRedirect` (308).
- **Images.** AVIF and WebP output is enabled.
- **Links.** Nav and footer link every SEO page, `/support` and `/legal/eula`.
- **Extension.** The manifest name is now "Kyriq – QuickBooks Check Reconciliation", with `short_name` "Kyriq".

**Phase 2: commercial pages.** `/pricing`, plus 4 `/features/*`, 5 `/for/*`, `/ca/cheque-reconciliation-quickbooks` and `/uk/cheque-reconciliation-quickbooks`. The CA, UK and US pages are linked by hreflang.

**Phase 3: comparisons.** 5 `/compare/*` pages, each with a capability table, a "when they are the better choice" section and sources.

**Phase 4: guides.** 8 `/guides/*` pages, about 900–1,000 words each, including one en-CA cheque guide, plus the `/guides` hub.

**Phase 5: free tools.**
- `/tools/micr-line-decoder` runs entirely in the browser. It decodes US and Canadian lines and validates the ABA checksum. `scripts/check-micr.ts` is its self-check.
- `/tools/outstanding-checks-template` offers the outstanding-checks and check-register CSV templates.

**Phase 6 (in part).** `public/llms.txt`.

### URL changes from the plan above

| Planned | Built |
|---|---|
| `/chrome-extension` | `/features/quickbooks-chrome-extension` |
| Free tools | Under `/tools/*` |

### Needs the owner or the client (not done)

| Item | Why it's open |
|---|---|
| **Hero H1 rewrite** | The H1 and the 15 FAQs are client-approved copy (`scripts/check-landing.ts` guards them). Proposed H1: "Check reconciliation for QuickBooks Online: match and clear every check". It needs Michael's sign-off. |
| **Vercel environment variables** | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`, and `NEXT_PUBLIC_CHROME_EXTENSION_URL` once the store listing is live. |
| **Search Console and Bing Webmaster** | Verify the site, then submit `https://kyriq.com/sitemap.xml`. |
| **Analytics** | Choose GA4 or Plausible. It isn't added, because it needs an account and a cookie/consent decision. |
| **www → apex redirect** | Switch it to 308 in the Vercel domain settings. |
| **Content fact-check** | A human pass over the guides and comparison pages. See the notes below. |
| **CA/UK support** | Confirm a real Canadian and UK QuickBooks Online company works end to end before promoting the cheque pages. |
| **Spelling normalisation** | Legal pages, the EULA, emails and Stripe copy still say "cheque". Legal text should change only with legal review. |
| **Landing page to server component** | Deferred. The page already renders to HTML. The win (smaller JS, earlier LCP) is real but the refactor touches client-approved UI. |
| **Export / integration pages** | Skipped: the product is positioned reconcile-first and supports QuickBooks Online only. |
| **"Check image to CSV" demo** | Skipped until there is a cost and abuse review, because it calls paid OCR. |
| **Phase 6 off-site** | Review sites, community answers, the QuickBooks App Store listing and YouTube videos. |
| **Phase 7 monitoring** | After deploy, run `/seo drift baseline https://kyriq.com`, then `/seo drift compare` monthly. |

### Content fact-check notes (from the writers)

**Guides**
- **Navigation.** Intuit's 2026 docs use All apps > Accounting > Reconcile and Bank transactions. The guides also mention the older Transactions menu.
- **Undoing a reconciliation.** Intuit's current US article lets the Primary Admin undo a reconciliation, not only accountant users. The guides say this.
- **Unconfirmed in Intuit's docs.** The register setting "Reconcile and banking status", the duplicate-check-number setting path, and the bank-rules page location came from community answers.
- **Unclaimed property.** The examples of provincial programs (Quebec, BC, Alberta) are from general knowledge.

**Comparisons**
- Competitor prices are quoted only where they were read on the competitor's own pricing page, with "as of October 2026":
  - DocuClipper: from $29/mo for 60 pages
  - SaasAnt: from $25/mo for a single company
  - Dext: $302.50/yr
  - Hubdoc: $12/mo
- Hubdoc's QuickBooks Desktop support comes from an old help article.
- Re-verify the competitor pages every quarter.
