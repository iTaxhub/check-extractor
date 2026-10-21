/**
 * Two Intuit app-assessment answers have to stay true:
 *   Error Handling 2: the app captures the intuit_tid response header.
 *   Error Handling 4: customers can reach support from inside the app.
 *
 *   cd frontend && npx tsx scripts/check-intuit-readiness.ts
 *
 * No framework, like the other check-* scripts.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeCall, intuitTid, qbFetch, sandboxAware } from '../lib/qb-http';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../lib/support';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8');

async function main() {
  // ── qbFetch records intuit_tid and changes nothing else ─────────────────────
  const logs: string[] = [];
  const errors: string[] = [];
  const realLog = console.log;
  const realError = console.error;
  console.log = (m: string) => { logs.push(String(m)); };
  console.error = (m: string) => { errors.push(String(m)); };

  const realFetch = globalThis.fetch;
  let seen: { url: string; init?: RequestInit } | null = null;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    seen = { url: String(url), init };
    const failing = String(url).includes('/fail');
    return new Response('{}', { status: failing ? 400 : 200, headers: { intuit_tid: failing ? 'tid-bad-999' : 'tid-ok-123' } });
  }) as typeof fetch;

  try {
    const body = new URLSearchParams({ a: '1' });
    const ok = await qbFetch('https://quickbooks.api.intuit.com/v3/company/9130357/query?query=select%20*%20from%20Purchase&minorversion=73',
      { method: 'POST', body });
    assert.equal(ok.status, 200);
    assert.equal(intuitTid(ok), 'tid-ok-123');
    assert.equal(seen!.init?.body, body, 'arguments pass through untouched');
    assert.equal(logs.length, 1);
    assert.match(logs[0], /\[qbo\] POST \/v3\/company\/:realm\/query 200 intuit_tid=tid-ok-123/);
    assert.ok(!logs[0].includes('9130357') && !logs[0].includes('Purchase'), 'company id and query are not logged');

    const bad = await qbFetch('https://quickbooks.api.intuit.com/v3/company/9130357/fail');
    assert.equal(bad.status, 400);
    assert.equal(errors.length, 1, 'a failed call logs as an error');
    assert.match(errors[0], /GET \/v3\/company\/:realm\/fail 400 intuit_tid=tid-bad-999/);

    // A response with no headers at all (a test double, a proxy quirk) is passed through, not thrown on.
    globalThis.fetch = (async () => ({ ok: true, status: 200, json: async () => ({}) })) as unknown as typeof fetch;
    const bare = await qbFetch('https://quickbooks.api.intuit.com/v3/company/1/companyinfo/1');
    assert.equal(bare.status, 200);
    assert.equal(intuitTid(bare), null);

    // A network failure still throws, exactly as plain fetch did.
    globalThis.fetch = (async () => { throw new TypeError('network down'); }) as typeof fetch;
    await assert.rejects(() => qbFetch('https://quickbooks.api.intuit.com/x'), /network down/);
  } finally {
    globalThis.fetch = realFetch;
    console.log = realLog;
    console.error = realError;
  }
  assert.equal(describeCall('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'), '/oauth2/v1/tokens/bearer');
  assert.equal(describeCall('not a url'), 'unparseable-url');

  // ── development keys connect a SANDBOX company, which only the sandbox host serves ──
  const prod = 'https://quickbooks.api.intuit.com/v3/company/4620816365353047000/companyinfo/4620816365353047000?minorversion=73';
  const oauth = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  const was = process.env.QB_SANDBOX;
  try {
    delete process.env.QB_SANDBOX;
    assert.equal(sandboxAware(prod), prod, 'unset: production host untouched');
    process.env.QB_SANDBOX = 'false';
    assert.equal(sandboxAware(prod), prod, 'only the string "true" switches');
    process.env.QB_SANDBOX = 'true';
    assert.equal(sandboxAware(prod), prod.replace('//quickbooks.api', '//sandbox-quickbooks.api'));
    assert.equal(String(sandboxAware(new URL(prod))), prod.replace('//quickbooks.api', '//sandbox-quickbooks.api'));
    assert.equal(sandboxAware(oauth), oauth, 'the OAuth endpoints are the same for sandbox and production');
    const already = prod.replace('//quickbooks.api', '//sandbox-quickbooks.api');
    assert.equal(sandboxAware(already), already, 'an already-sandbox URL is not rewritten twice');
  } finally {
    if (was === undefined) delete process.env.QB_SANDBOX; else process.env.QB_SANDBOX = was;
  }

  // ── the company switchers lead with the company name; the realm id is a small reference ──
  for (const f of ['components/CompanySwitcher.tsx', 'components/QBCompanySwitcher.tsx']) {
    const src = read(f);
    assert.ok(!/companyName \|\| `Realm/.test(src), `${f} still shows the realm id as the title`);
    assert.ok(src.includes("conn.companyName || 'QuickBooks company'"), `${f} has no company-name title`);
    assert.ok(/text-\[10px\][^"]*">Realm \{conn\.realmId\}/.test(src), `${f} does not show the realm id small`);
  }

  // ── every Intuit call goes through qbFetch ──────────────────────────────────
  const routes = [
    'qbo/accounts', 'qbo/callback', 'qbo/clear-transaction', 'qbo/company-info', 'qbo/create-check', 'qbo/diagnose',
    'qbo/disconnect', 'qbo/explore', 'qbo/health-check', 'qbo/preview', 'qbo/pull-checks', 'qbo/update-transaction',
    'matches/sync-qb', 'matches/create-in-qb', 'debug/qb-clear',
  ].map((r) => `pages/api/${r}.ts`).concat('lib/qb-token.ts');
  for (const f of routes) {
    const src = read(f);
    assert.ok(!/\bawait fetch\(/.test(src), `${f} still calls fetch() directly`);
    assert.ok(src.includes("from '@/lib/qb-http'"), `${f} does not import qbFetch`);
  }

  // ── support: one address, in the app, the EULA and the 404 page ─────────────
  assert.equal(SUPPORT_EMAIL, 'support@kyriq.com');
  assert.equal(SUPPORT_MAILTO, 'mailto:support@kyriq.com');
  assert.ok(read('app/(app)/layout.tsx').includes('SUPPORT_MAILTO'), 'sidebar has no Help link');
  assert.ok(read('components/ShellTopBar.tsx').includes('SUPPORT_MAILTO'), 'top bar has no Help link');
  assert.ok(read('app/not-found.tsx').includes('SUPPORT_MAILTO'));

  function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (/\.(tsx?|json)$/.test(name)) out.push(p);
    }
    return out;
  }
  const stale = walk(path.join(root, 'app')).filter((f) => /chequeextractor.com|itaxhub.com/.test(readFileSync(f, 'utf8')));
  assert.deepEqual(stale, [], `an old domain (chequeextractor.com or itaxhub.com) is still shown in: ${stale.join(', ')}`);

  console.log('check-intuit-readiness: intuit_tid is recorded on all 24 Intuit calls, and Help is one tap away');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
