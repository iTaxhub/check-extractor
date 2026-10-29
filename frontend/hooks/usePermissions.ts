'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { can as roleCan, toDbRole, type Capability, type DbRole } from '@/lib/roles';

/**
 * The caller's role and a `can()` bound to it, from lib/roles.ts — the same
 * matrix the API enforces with requireCapability. This only hides/disables UI;
 * the server is the real gate.
 *
 * One fetch per page load, shared by every component (the own-profile row is
 * readable under the self-only RLS policy from migration 010).
 */
type Me = { userId: string; role: DbRole } | null;
let mePromise: Promise<Me> | null = null;

function loadMe(): Promise<Me> {
  mePromise ??= (async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('user_profiles').select('role').eq('id', user.id).maybeSingle();
    return data ? { userId: user.id, role: toDbRole(data.role) } : null;
  })().catch(() => {
    mePromise = null; // let the next mount retry
    return null;
  });
  return mePromise;
}

/** "Only an Administrator can …" — the tooltip for a disabled action. */
export const adminOnly = (action: string) => `Only an Administrator can ${action}.`;

export function usePermissions() {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    loadMe().then((m) => {
      if (!live) return;
      setMe(m);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  const role = me?.role ?? null;
  return {
    role,
    userId: me?.userId ?? null,
    loading,
    isAdmin: role === 'admin',
    /** Denies while loading, so a protected action never flashes enabled. */
    can: (capability: Capability) => role !== null && roleCan(role, capability),
  };
}
