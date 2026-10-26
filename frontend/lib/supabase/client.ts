import { createBrowserClient } from '@supabase/ssr';
import { processLock } from '@supabase/supabase-js';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // The default navigator.locks lock lets one auth call "steal" another's
      // lock, which surfaced as an uncaught "AbortError: Lock broken by another
      // request with the 'steal' option" whenever several components asked for
      // the session at once. processLock serialises them in-tab instead.
      auth: { lock: processLock },
    }
  );
}
