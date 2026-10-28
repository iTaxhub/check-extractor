/**
 * Self-check for the SEO content pages (lib/marketing/content).
 *
 *   cd frontend && npx tsx scripts/check-marketing.ts
 *
 * Catches the quiet failures: a `related` link to a page that does not exist,
 * a title Google will truncate, two pages on one URL, and a public path the
 * proxy would bounce to /login.
 */
import assert from 'node:assert/strict';
import { PAGES } from '../lib/marketing/content';
import { pagePath } from '../lib/marketing/types';
import { STATIC_MARKETING_PATHS, isMarketingPath } from '../lib/marketing/routes';

const paths = PAGES.map(pagePath);
assert.equal(new Set(paths).size, paths.length, 'two content pages share a URL');

const known = new Set<string>([...paths, ...STATIC_MARKETING_PATHS]);
for (const p of PAGES) {
  const at = pagePath(p);
  assert.ok(isMarketingPath(at), `${at} is not public in lib/marketing/routes.ts, so the proxy sends it to /login`);
  assert.ok(p.title.length <= 60, `${at}: title is ${p.title.length} chars (max 60): ${p.title}`);
  assert.ok(p.description.length >= 70 && p.description.length <= 160, `${at}: description is ${p.description.length} chars (70-160, open-seo thresholds)`);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(p.updated), `${at}: updated must be YYYY-MM-DD`);
  for (const r of p.related ?? []) assert.ok(known.has(r), `${at}: related link ${r} goes nowhere`);
  for (const alt of Object.values(p.alternates ?? {})) assert.ok(known.has(alt!), `${at}: hreflang ${alt} goes nowhere`);
}
console.log(`ok  ${PAGES.length} content pages: unique URLs, public, titles, descriptions, links and hreflang resolve`);

// check/cheque by location (legal pages, emails, the signed-in app).
import { resolveSpelling, spell, spellingFor } from '../lib/spelling';
assert.equal(spellingFor('CA'), 'cheque');
assert.equal(spellingFor('gb'), 'cheque');
assert.equal(spellingFor('Canada'), 'cheque');
assert.equal(spellingFor('US'), 'check');
assert.equal(spellingFor(null), 'check');
assert.equal(spell('Cheque images and check data; 3 checks.', 'cheque'), 'Cheque images and cheque data; 3 cheques.');
assert.equal(spell('Cheques and cheque images', 'check'), 'Checks and check images');
assert.equal(spell('Cheque Extractor grants you', 'check'), 'Cheque Extractor grants you');
assert.equal(spell('Check the connection', 'cheque'), 'Check the connection');
assert.equal(spell('checksum, checkout, checked', 'cheque'), 'checksum, checkout, checked');
assert.equal(spell('3 cheques, check this one', 'cheque'), '3 cheques, check this one');
assert.equal(spell('Cheques this period', 'check'), 'Checks this period');
assert.equal(spell('Cheques the firm wrote', 'check'), 'Checks the firm wrote');
// App rule: QuickBooks country first, then the browser locale's region, then "check".
assert.equal(resolveSpelling('US', 'en-CA'), 'check');
assert.equal(resolveSpelling('CA', 'en-US'), 'cheque');
assert.equal(resolveSpelling(null, 'en-CA'), 'cheque');
assert.equal(resolveSpelling('', 'fr_CA'), 'cheque');
assert.equal(resolveSpelling(undefined, 'en-GB'), 'cheque');
assert.equal(resolveSpelling(null, 'zh-Hant-TW'), 'check');
assert.equal(resolveSpelling(null, 'en'), 'check');
assert.equal(resolveSpelling(null, null), 'check');
console.log('ok  check/cheque spelling by country');
