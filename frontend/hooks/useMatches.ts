'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, qk } from '@/lib/queries';

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface UseMatchesOptions {
  /** One status, 'all', or a comma-separated union (the Review step's tabs). */
  status?: string;
  search?: string;
  sort?: string;
  /** 1-based. */
  page?: number;
  /** Records per page. The grid offers up to 2000; do not cap it lower here. */
  limit?: number;
  /**
   * Scope every read to one reconciliation batch. Omitted (or null) means the
   * whole active company, which is right for a standalone matches view but
   * WRONG inside the stepper: an unscoped Review tab shows other periods'
   * cheques and its counts then contradict the stepper's batch_counts().
   */
  batchId?: string | null;
}

const one = (id: string) => new Set([id]);
/** Row actions report failure through `error` (set by `optimistic`), not a throw. */
const swallow = () => undefined;

interface MatchesPage {
  matches: any[];
  total: number;
  statusCounts: Record<string, number>;
}

/**
 * The Review list, as a cached query keyed by
 * ['matches', batchId, status, search, sort, page, limit].
 *
 * Every row action is optimistic: the cached page (rows AND statusCounts) is
 * patched at once, the server's answer is applied on success, and the snapshot
 * is restored on failure. Background refetches keep the current rows on screen
 * (`isLoading` is true only before the first data arrives; `isRefreshing`
 * covers the rest).
 */
export function useMatches({
  status = 'all',
  search = '',
  sort = 'confidence',
  page = 1,
  limit = 50,
  batchId = null,
}: UseMatchesOptions = {}) {
  const qc = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const searchDebounced = useDebounce(search, 350);

  const queryKey = useMemo(
    () => [...qk.matches, batchId, status, searchDebounced, sort, page, limit] as const,
    [batchId, status, searchDebounced, sort, page, limit]
  );

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<MatchesPage> => {
      const params = new URLSearchParams({ sort, page: String(page), limit: String(limit) });
      if (status && status !== 'all') params.set('status', status);
      if (searchDebounced) params.set('search', searchDebounced);
      if (batchId) params.set('batchId', batchId);

      const data = await apiFetch(`/api/matches?${params}`);
      if (!Array.isArray(data.matches)) {
        // A 200 is not proof of success: assert on the parsed shape.
        throw new Error('Matches response did not contain a matches array');
      }
      return {
        matches: data.matches,
        total: typeof data.total === 'number' ? data.total : data.matches.length,
        statusCounts: data.statusCounts || {},
      };
    },
  });

  /**
   * Which statuses the current view is showing. `status` may be a union, so the
   * optimistic "did this row just leave the list?" decision has to be set
   * membership, not string equality: with `status` = 'pending,flagged,...',
   * `status === 'flagged'` is false, and flagging a row would have dropped it
   * out of the very tab that is supposed to contain it.
   */
  const viewStatuses = useMemo(
    () => new Set(status.split(',').map((s) => s.trim()).filter(Boolean)),
    [status]
  );
  const showsStatus = useCallback(
    (s: string) => status === 'all' || viewStatuses.has(s),
    [status, viewStatuses]
  );

  /** Patch rows by id; a status change moves statusCounts and may drop the row. */
  const patchRows = useCallback(
    (d: MatchesPage, ids: Set<string>, patch: Record<string, any>): MatchesPage => {
      const counts = { ...d.statusCounts };
      let removed = 0;
      const matches = d.matches.flatMap((m) => {
        if (!ids.has(m.id)) return [m];
        const next = { ...m, ...patch };
        if (next.status !== m.status) {
          counts[m.status] = Math.max(0, (counts[m.status] || 0) - 1);
          counts[next.status] = (counts[next.status] || 0) + 1;
        }
        if (!showsStatus(next.status)) {
          removed++;
          return [];
        }
        return [next];
      });
      return { matches, statusCounts: counts, total: Math.max(0, d.total - removed) };
    },
    [showsStatus]
  );

  /**
   * Snapshot → optimistic patch → request → apply the server's answer, or roll
   * back. Other cached pages/filters are marked stale (not refetched now).
   */
  const optimistic = useCallback(
    async <T,>(
      apply: ((d: MatchesPage) => MatchesPage) | null,
      run: () => Promise<T>,
      settle?: (res: T, d: MatchesPage) => MatchesPage
    ): Promise<T> => {
      setActionError(null);
      await qc.cancelQueries({ queryKey });
      const snapshot = qc.getQueryData<MatchesPage>(queryKey);
      if (snapshot && apply) qc.setQueryData(queryKey, apply(snapshot));
      try {
        const res = await run();
        if (settle) qc.setQueryData<MatchesPage>(queryKey, (d) => (d ? settle(res, d) : d));
        qc.invalidateQueries({ queryKey: qk.matches, refetchType: 'none' });
        return res;
      } catch (e: any) {
        if (snapshot) qc.setQueryData(queryKey, snapshot);
        setActionError(e?.message || 'Request failed');
        throw e;
      }
    },
    [qc, queryKey]
  );

  const fetchMatches = useCallback(async () => {
    setActionError(null);
    await query.refetch();
  }, [query]);

  const syncQB = useCallback(async () => {
    setIsSyncing(true);
    setActionError(null);
    try {
      await apiFetch('/api/matches/sync-qb', { method: 'POST' });
      await qc.invalidateQueries({ queryKey: qk.matches });
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setIsSyncing(false);
    }
  }, [qc]);

  const approveSingle = useCallback(
    (matchId: string) =>
      optimistic(
        (d) => patchRows(d, one(matchId), { status: 'approved', approved_at: new Date().toISOString() }),
        () => apiFetch(`/api/matches/${matchId}/approve`, { method: 'POST' }),
        (res, d) => patchRows(d, one(matchId), { status: res.status || 'approved', approved_at: res.approved_at, approved_by: res.approved_by })
      ).then(swallow, swallow),
    [optimistic, patchRows]
  );

  const bulkApprove = useCallback(
    async (body: any = {}) => {
      // Same selection rule as the server: matched/pending rows, by id or by threshold.
      const ids: string[] | undefined = body.matchIds;
      const min = typeof body.minConfidence === 'number' ? body.minConfidence : 95;
      try {
        const result = await optimistic(
          (d) =>
            patchRows(
              d,
              new Set(
                d.matches
                  .filter((m) => (m.status === 'matched' || m.status === 'pending') &&
                    (ids?.length ? ids.includes(m.id) : (m.confidence_score ?? 0) >= min))
                  .map((m) => m.id)
              ),
              { status: 'approved', approved_at: new Date().toISOString() }
            ),
          () =>
            apiFetch('/api/matches/bulk-approve', {
              method: 'POST',
              // The batch this hook is reading is the batch it may approve. Sent
              // from here rather than left to each caller, so a new call site
              // cannot forget it and quietly approve another batch's matches.
              body: JSON.stringify({ ...(batchId ? { batchId } : {}), ...body }),
            })
        );
        // Rows on other pages changed too: refetch in the background (the
        // current rows stay on screen while it runs).
        qc.invalidateQueries({ queryKey: qk.matches });
        return result;
      } catch {
        return undefined;
      }
    },
    [optimistic, patchRows, batchId, qc]
  );

  const flagMatch = useCallback(
    (matchId: string, reason: string = '') =>
      optimistic(
        (d) => patchRows(d, one(matchId), { status: 'flagged', flagged_reason: reason }),
        () => apiFetch(`/api/matches/${matchId}/flag`, { method: 'POST', body: JSON.stringify({ reason }) })
      ).then(swallow, swallow),
    [optimistic, patchRows]
  );

  const addNote = useCallback(
    (matchId: string, note: string) =>
      optimistic(
        (d) => patchRows(d, one(matchId), { notes: note }),
        () => apiFetch(`/api/matches/${matchId}/note`, { method: 'POST', body: JSON.stringify({ note }) })
      ).then(swallow, swallow),
    [optimistic, patchRows]
  );

  const resolveDiscrepancy = useCallback(
    (matchId: string, resolution: string, amount: number | null, notes: string) =>
      optimistic(
        (d) => patchRows(d, one(matchId), { status: 'matched', resolution, resolution_notes: notes }),
        () =>
          apiFetch(`/api/matches/${matchId}/resolve-discrepancy`, {
            method: 'POST',
            body: JSON.stringify({ resolution, amount, notes }),
          }),
        (res, d) => (res?.status ? patchRows(d, one(matchId), { status: res.status }) : d)
      ).then(swallow, swallow),
    [optimistic, patchRows]
  );

  const remapMatch = useCallback(
    (matchId: string, qbTxnId: string) =>
      optimistic(
        null,
        () => apiFetch(`/api/matches/${matchId}/remap`, { method: 'POST', body: JSON.stringify({ qbTxnId }) }),
        // The server re-scores, so its answer is what the row becomes.
        (res, d) => {
          const fields = { ...(res || {}) };
          delete fields.success;
          return Object.keys(fields).length ? patchRows(d, one(matchId), fields) : d;
        }
      ).catch(swallow),
    [optimistic, patchRows]
  );

  const undoApproval = useCallback(
    (matchId: string) =>
      optimistic(
        (d) => patchRows(d, one(matchId), { status: 'matched', approved_at: null, approved_by: null }),
        () => apiFetch(`/api/matches/${matchId}/undo-approval`, { method: 'POST' }),
        (res, d) => (res?.status ? patchRows(d, one(matchId), { status: res.status }) : d)
      ).then(swallow, swallow),
    [optimistic, patchRows]
  );

  const createInQB = useCallback(
    (checkId: string) => {
      const ids = (d: MatchesPage) => new Set(d.matches.filter((m) => m.check?.id === checkId).map((m) => m.id));
      // Rethrows: the caller shows its own failure state.
      return optimistic(
        (d) => patchRows(d, ids(d), { status: 'approved', confidence_score: 100, resolution: 'created_in_qb' }),
        () => apiFetch('/api/matches/create-in-qb', { method: 'POST', body: JSON.stringify({ checkId }) }),
        (res, d) => (res?.qb_txn ? patchRows(d, ids(d), { qb_txn: res.qb_txn }) : d)
      );
    },
    [optimistic, patchRows]
  );

  const updateQBTransaction = useCallback(
    async (qbTxnId: string, fields: { txnDate?: string; docNumber?: string; memo?: string }) => {
      setActionError(null);
      try {
        const result = await apiFetch('/api/qbo/update-transaction', {
          method: 'PATCH',
          body: JSON.stringify({ qbTxnId, fields }),
        });
        // Patch the local qb_txn data on the matching match row.
        qc.setQueryData<MatchesPage>(queryKey, (d) =>
          d && {
            ...d,
            matches: d.matches.map((m) =>
              !m.qb_txn || m.qb_txn.id !== qbTxnId
                ? m
                : {
                    ...m,
                    qb_txn: {
                      ...m.qb_txn,
                      ...(fields.txnDate   ? { txn_date: fields.txnDate }   : {}),
                      ...(fields.docNumber ? { doc_number: fields.docNumber } : {}),
                      ...(fields.memo      ? { memo: fields.memo }           : {}),
                    },
                  }
            ),
          }
        );
        return result;
      } catch (e: any) {
        setActionError(e.message);
        throw e;
      }
    },
    [qc, queryKey]
  );

  const data = query.data;
  const queryError = query.error ? (query.error as Error).message : null;

  return {
    matches: data?.matches ?? [],
    total: data?.total ?? 0,
    statusCounts: data?.statusCounts ?? {},
    /** True only until the first page arrives: never blanks a populated list. */
    isLoading: query.isPending,
    /** A background refetch over rows already on screen. */
    isRefreshing: query.isFetching && !query.isPending,
    isSyncing,
    error: actionError ?? queryError,
    refresh: fetchMatches,
    syncQB,
    approveSingle,
    bulkApprove,
    flagMatch,
    addNote,
    resolveDiscrepancy,
    remapMatch,
    undoApproval,
    createInQB,
    updateQBTransaction,
  };
}
