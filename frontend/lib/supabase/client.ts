import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // No cross-call auth lock. navigator.locks threw "Lock broken by another
      // request with the 'steal' option"; processLock queued every auth call
      // behind slow /auth/v1/user round-trips until they timed out ("Acquiring
      // process lock ... timed out"), which emptied History and QB Comparisons.
      // ponytail: two tabs refreshing at the same instant can both refresh;
      // Supabase's refresh-token reuse window absorbs that.
      auth: { lock: async (_name: string, _timeout: number, fn: () => Promise<any>) => fn() },
    }
  );
}
