/**
 * Decodes a typed-out MICR line (the E-13B numbers along the bottom of a check)
 * for the free /tools/micr-line-decoder page. Pure function, runs in the browser.
 *
 * Symbols are accepted as the real glyphs or the usual keyboard stand-ins:
 *   transit ⑆ = T, A or :     on-us ⑈ = U, C or "     amount ⑇ = $ or B     dash ⑉ = D
 *
 * ponytail: field order is the common US/Canadian layout (aux on-us, transit,
 * on-us with account before the on-us symbol and serial after it). Banks vary
 * the on-us field; unusual layouts come back with a warning, not a guess.
 */

export interface MicrResult {
  country?: 'US' | 'CA';
  routing?: string;
  routingValid?: boolean;
  transit?: string;
  institution?: string;
  account?: string;
  checkNumber?: string;
  amount?: string;
  warnings: string[];
}

/** ABA checksum: 3·(d1+d4+d7) + 7·(d2+d5+d8) + (d3+d6+d9) ≡ 0 (mod 10). */
export function abaValid(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false;
  const d = [...routing].map(Number);
  return (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10 === 0;
}

const digits = (s: string) => s.replace(/[^\d-]/g, '').replace(/^-+|-+$/g, '');

export function decodeMicr(input: string): MicrResult {
  const warnings: string[] = [];
  const s = input
    .toUpperCase()
    .replace(/[⑆A:]/g, 'T')
    .replace(/[⑈C"]/g, 'U')
    .replace(/[⑇B]/g, '$')
    .replace(/[⑉D]/g, '-')
    .replace(/[^\dTU$\- ]/g, ' ');

  const r: MicrResult = { warnings };

  const transit = s.match(/T\s*([\d\s-]+?)\s*T/);
  if (!transit) {
    warnings.push('No routing field found. It sits between two transit symbols (⑆), typed here as T.');
    return r;
  }
  const routing = transit[1].replace(/\s/g, '');
  if (/^\d{9}$/.test(routing)) {
    r.country = 'US';
    r.routing = routing;
    r.routingValid = abaValid(routing);
    if (!r.routingValid) warnings.push('The routing number fails the ABA checksum. Check for a mistyped digit.');
  } else if (/^\d{5}-\d{3}$/.test(routing)) {
    r.country = 'CA';
    [r.transit, r.institution] = routing.split('-');
  } else {
    warnings.push(`"${routing}" is not a 9-digit US routing number or a Canadian transit-institution pair (12345-678).`);
  }

  const before = s.slice(0, transit.index);
  const aux = before.match(/U\s*([\d\s-]+?)\s*U/);
  if (aux) r.checkNumber = digits(aux[1]);

  let rest = s.slice((transit.index ?? 0) + transit[0].length);
  const amount = rest.match(/\$\s*(\d{10})\s*\$/);
  if (amount) {
    r.amount = (Number(amount[1]) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    rest = rest.replace(amount[0], ' ');
  }

  const onUs = rest.match(/^\s*([\d\s-]*?)\s*U\s*([\d\s-]*)$/);
  if (onUs) {
    r.account = digits(onUs[1]) || undefined;
    const serial = digits(onUs[2]);
    if (serial && !r.checkNumber) r.checkNumber = serial;
  } else if (digits(rest)) {
    r.account = digits(rest);
    warnings.push('No on-us symbol (⑈) found, so the account and check number could not be separated.');
  }
  if (!r.account) warnings.push('No account number found after the routing field.');
  return r;
}
