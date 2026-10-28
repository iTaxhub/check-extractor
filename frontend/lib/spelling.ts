/**
 * "check" for US readers, "cheque" for Canada, the UK and other Commonwealth
 * readers. Used by the legal pages (visitor location) and emails (the firm's
 * QuickBooks company country).
 *
 * ponytail: a word swap, safe only on text where check/cheque is the NOUN.
 * The verbs in that text ("Check the connection", "check this one") are excluded explicitly;
 * new copy that uses "check" as a verb needs the same treatment.
 */

export type Spelling = 'check' | 'cheque';

const CHEQUE_COUNTRIES = new Set(['CA', 'GB', 'UK', 'AU', 'NZ', 'IE', 'IN', 'ZA']);

/** ISO country code (any case, or a QuickBooks name like "Canada") to a spelling. */
export function spellingFor(country: string | null | undefined): Spelling {
  const c = (country ?? '').trim().toUpperCase();
  if (CHEQUE_COUNTRIES.has(c)) return 'cheque';
  if (['CANADA', 'UNITED KINGDOM', 'AUSTRALIA', 'NEW ZEALAND', 'IRELAND', 'INDIA', 'SOUTH AFRICA'].includes(c)) return 'cheque';
  return 'check';
}

/**
 * The app's rule: the active QuickBooks company's country when known, else the
 * region of the browser locale ('en-CA', 'fr_CA', 'zh-Hant-TW'), else "check".
 */
export function resolveSpelling(qbCountry?: string | null, locale?: string | null): Spelling {
  if (qbCountry?.trim()) return spellingFor(qbCountry);
  return spellingFor(/[-_]([a-z]{2})\b/i.exec(locale ?? '')?.[1]);
}

/** Rewrite check(s)/cheque(s) to one spelling, keeping case. Leaves "Cheque Extractor", "Check the …" and "check this" alone (singular only, so "Cheques this period" still converts). */
export function spell(text: string, to: Spelling): string {
  return text.replace(/\b([Cc])he(?:ck|que)(?:(s)\b|\b(?! Extractor| the\b| this\b))/g, (_m, c: string, s?: string) =>
    c + (to === 'cheque' ? 'heque' : 'heck') + (s || '')
  );
}
