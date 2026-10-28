'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

let seq = 0;

/**
 * Generic live refresh: any INSERT/UPDATE/DELETE on `table` (optionally
 * narrowed by a postgres_changes `filter` such as `job_id=eq.abc`) calls
 * `onChange`, debounced so a burst of row events causes one refetch.
 *
 * Same contract as useRealtimeMatches: the payload is a signal only, and RLS
 * (tenant_id = user_tenant_id()) is the security boundary, not the filter.
 * If the table is not in the supabase_realtime publication yet (migration 052
 * unapplied), nothing fires and callers' fallback polling carries on.
 * Pass `table = null` to disable.
 */
export function useRealtimeTable(
  table: string | null,
  filter: string | undefined,
  onChange: () => void,
  delayMs = 300
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!table) return;
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        onChangeRef.current();
      }, delayMs);
    };

    const channel = supabase
      .channel(`rt:${table}:${filter ?? '*'}:${++seq}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        schedule
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [table, filter, delayMs]);
}

/** useRealtimeTable that invalidates query keys (prefix match) on change. */
export function useRealtimeInvalidate(table: string | null, filter: string | undefined, keys: QueryKey[]) {
  const qc = useQueryClient();
  const keysRef = useRef(keys);
  keysRef.current = keys;
  useRealtimeTable(table, filter, () => {
    for (const queryKey of keysRef.current) qc.invalidateQueries({ queryKey });
  });
}
