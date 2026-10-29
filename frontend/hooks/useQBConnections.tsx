'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authHeaders, qk } from '@/lib/queries';

export interface QBConnection {
  id: string;
  realmId: string;
  companyName: string;
  logoUrl?: string;
  isActive: boolean;
  connectedAt: string;
  pendingCount: number;
  /** qb_connections.status — connection HEALTH, not which company is selected. */
  status: QbConnectionHealth;
  /** Cached bank + credit-card accounts for this company (migration 036). */
  accountCount: number;
  /** CompanyInfo.Country (migration 051), e.g. 'US', 'CA'; null until fetched. */
  country?: string | null;
}

export type QbConnectionHealth =
  | 'connected'
  | 'needs_reconnect'
  | 'error'
  | 'revoked'
  | 'unknown';

/** The two statuses that mean only the user can fix it. */
export function needsReconnect(status: QbConnectionHealth | undefined): boolean {
  return status === 'needs_reconnect' || status === 'revoked';
}

interface QBContextValue {
  connections: QBConnection[];
  active: QBConnection | null;
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  switchCompany: (realmId: string) => Promise<QBConnection | undefined>;
  disconnect: (realmId: string) => Promise<void>;
  refresh: () => Promise<void>;
  hasConnections: boolean;
  connectionCount: number;
}

const QBContext = createContext<QBContextValue | null>(null);

export function QBProvider({ children }: { children: ReactNode }) {
  const qb = useQBConnectionsInternal();
  return <QBContext.Provider value={qb}>{children}</QBContext.Provider>;
}

export function useQBConnections(): QBContextValue {
  const ctx = useContext(QBContext);
  if (!ctx) throw new Error('useQBConnections must be used inside <QBProvider>');
  return ctx;
}

/** Same context, but null outside <QBProvider> instead of throwing. */
export function useOptionalQBConnections(): QBContextValue | null {
  return useContext(QBContext);
}

const getAuthHeaders = authHeaders;

interface QBConnectionsData {
  connections: QBConnection[];
  active: QBConnection | null;
}

const EMPTY: QBConnectionsData = { connections: [], active: null };

async function fetchConnections(): Promise<QBConnectionsData> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/qb/connections', { headers });
    if (!res.ok) {
      // Not an error if user simply has no connections yet
      if (res.status === 400 || res.status === 404) return EMPTY;
      throw new Error('Failed to fetch connections');
    }
    const data = await res.json();
    const normalise = (c: any): QBConnection => ({
      ...c,
      status: (c?.status as QbConnectionHealth) || 'connected',
      accountCount: c?.accountCount ?? 0,
      pendingCount: c?.pendingCount ?? 0,
    });
    return {
      connections: (data.connections || []).map(normalise),
      active: data.activeConnection ? normalise(data.activeConnection) : null,
    };
  } catch (err: any) {
    // Silently handle — user may not have qb_connections table yet
    console.warn('QB connections fetch:', err.message);
    return EMPTY;
  }
}

/**
 * Backed by the ['qb-connections'] query, so every consumer (and the realtime
 * invalidation in the app layout) shares one cached request.
 */
function useQBConnectionsInternal(): QBContextValue {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: qk.qbConnections, queryFn: fetchConnections });
  const { connections, active } = query.data ?? EMPTY;
  const isLoading = query.isPending;
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setData = useCallback(
    (fn: (d: QBConnectionsData) => QBConnectionsData) =>
      qc.setQueryData<QBConnectionsData>(qk.qbConnections, (d) => fn(d ?? EMPTY)),
    [qc]
  );

  const refresh = useCallback(async () => {
    setError(null);
    await qc.invalidateQueries({ queryKey: qk.qbConnections });
  }, [qc]);

  const switchCompany = useCallback(
    async (realmId: string) => {
      if (realmId === active?.realmId) return active;
      setIsSwitching(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/qb/switch', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ realmId }),
        });
        if (!res.ok) throw new Error('Failed to switch company');
        await res.json();

        // The active company lives in qb_connections.is_active, which the POST
        // above just moved — never in localStorage. The matching routes and the
        // extension read that column, so a client-side-only switch would show
        // company B while the match engine still worked on company A.
        //
        // The row already in state carries the health status, account count and
        // pending count; /api/qb/switch answers with an identity only, so
        // adopting its payload here would blank all three.
        const next = connections.find((c) => c.realmId === realmId) ?? null;
        setData((d) => ({
          active: next ? { ...next, isActive: true } : null,
          connections: d.connections.map((c) => ({ ...c, isActive: c.realmId === realmId })),
        }));
        // Company-scoped data must not show the previous company's rows.
        qc.removeQueries({ queryKey: qk.quickbooksEntries() });
        for (const queryKey of [['qbo-accounts'], qk.matches, qk.jobs]) qc.invalidateQueries({ queryKey });
        return next ?? undefined;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsSwitching(false);
      }
    },
    [active, connections, setData]
  );

  const disconnect = useCallback(
    async (realmId: string) => {
      try {
        const headers = await getAuthHeaders();
        await fetch('/api/qbo/disconnect', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ realmId }),
        });
        await refresh();
      } catch (err: any) {
        setError(err.message);
      }
    },
    [refresh]
  );

  return {
    connections,
    active,
    isLoading,
    isSwitching,
    error,
    switchCompany,
    disconnect,
    refresh,
    hasConnections: connections.length > 0,
    connectionCount: connections.length,
  };
}
