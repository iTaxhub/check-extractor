'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Live refresh for one reconciliation batch's matches.
 *
 * Two reviewers from the same firm work the same batch. Without this, User A's
 * approve never reaches User B's screen: B keeps the stale pre-approval row,
 * approves it too, and the loser gets a server error instead of a merge.
 *
 * Deliberately NOT a state merger. The payload is used only as a signal that
 * something changed; the refetch the Review step already owns is what produces
 * the new rows. That keeps one source of truth for shape, filtering, paging and
 * counts — a hand-rolled merge would have to re-implement all four.
 *
 * Degrades honestly: if realtime is disabled, the publication is missing, or
 * the socket never connects, this hook does nothing at all. Nothing on the page
 * waits on it or renders differently because of it.
 *
 * RLS is the tenant guard. `matches` has
 * `FOR SELECT USING (tenant_id = public.user_tenant_id())` (013), and realtime
 * evaluates that policy per row as the connected user, so the `batch_id` filter
 * below is a narrowing convenience, not the security boundary.
 */
export function useRealtimeMatches(batchId: string | null | undefined, onChange: () => void) {
  /** The latest callback, so a new `refresh` identity does not resubscribe. */
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!batchId) return;

    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    // ponytail: fixed 400ms coalescing window — a bulk-approve of 500 rows
    // fires 500 events, and one refetch covers them all. If refetches are ever
    // seen piling up behind a slow query, move to a trailing lock, not a longer
    // delay.
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        onChangeRef.current();
      }, 400);
    };

    const channel = supabase
      .channel(`matches:batch:${batchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `batch_id=eq.${batchId}` },
        schedule
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      // Unsubscribes and drops the socket topic — without this every
      // navigation into Review would leak a channel.
      supabase.removeChannel(channel);
    };
  }, [batchId]);
}
