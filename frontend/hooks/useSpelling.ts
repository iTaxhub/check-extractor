'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useOptionalQBConnections } from '@/hooks/useQBConnections';
import { resolveSpelling, spell } from '@/lib/spelling';

const noSubscribe = () => () => {};

/**
 * `t('Cheques found')` → "Checks found" or "Cheques found" for this firm:
 * the active QuickBooks company's country, else the browser locale's region,
 * else "check" (lib/spelling.ts resolveSpelling). Safe outside <QBProvider>
 * and on the server, where it falls back to the locale and then "check".
 */
export function useSpelling(): (text: string) => string {
  const country = useOptionalQBConnections()?.active?.country;
  // Server snapshot is null, so hydration matches; the client then re-renders with the real locale.
  const locale = useSyncExternalStore(noSubscribe, () => navigator.language, () => null);
  const to = resolveSpelling(country, locale);
  return useCallback((text: string) => spell(text, to), [to]);
}
