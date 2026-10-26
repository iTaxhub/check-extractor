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
