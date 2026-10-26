'use client';

import { useState } from 'react';
import { decodeMicr } from '@/lib/marketing/micr';

const EXAMPLE = '⑈004512⑈ ⑆011000015⑆ 9876543210⑈';

/** The interactive half of /tools/micr-line-decoder. Nothing leaves the browser. */
export function MicrDecoder() {
  const [line, setLine] = useState(EXAMPLE);
  const r = decodeMicr(line);
  const rows: [string, string | undefined][] = [
    ['Country format', r.country === 'CA' ? 'Canada' : r.country === 'US' ? 'United States' : undefined],
    ['Routing (ABA) number', r.routing && `${r.routing} ${r.routingValid ? '(checksum valid)' : '(checksum fails)'}`],
    ['Transit (branch) number', r.transit],
    ['Institution number', r.institution],
    ['Account number', r.account],
    ['Check number', r.checkNumber],
    ['Encoded amount', r.amount],
  ];

  return (
    <div className="glass-card rounded-card p-6 sm:p-8">
      <label htmlFor="micr" className="block text-sm font-semibold text-ink-strong mb-2">
        MICR line
      </label>
      <input
        id="micr"
        value={line}
        onChange={(e) => setLine(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        className="w-full rounded-input border border-glass-hairline bg-surface px-4 py-3 font-mono text-[15px] text-ink-strong"
      />
      <p className="mt-2 text-xs text-ink-faint">
        Type T for ⑆ (transit), U for ⑈ (on-us), $ for ⑇ (amount) and D for ⑉ (dash). Decoded in your browser; nothing is sent anywhere.
      </p>

      <dl className="mt-6 grid gap-2" aria-live="polite">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-2 rounded-input bg-surface/80 border border-glass-hairline px-4 py-2.5">
            <dt className="text-sm text-ink-soft">{k}</dt>
            <dd className="text-sm font-semibold text-ink-strong font-mono">{v}</dd>
          </div>
        ))}
      </dl>
      {r.warnings.map((w) => (
        <p key={w} className="mt-3 text-sm text-warning-text">{w}</p>
      ))}
    </div>
  );
}
