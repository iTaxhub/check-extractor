import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthContext, audit } from '@/lib/match-helpers';
import { createServiceClient } from '@/lib/supabase/api';
import { patchJobCheck } from '@/lib/check-sync';

/**
 * POST /api/matches/[id]/approve
 * Approve a single match
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query;
    const { notes } = req.body || {};
    const { supabase, userId, tenantId } = await getAuthContext(req);

    // Auth client read — enforces tenant isolation via RLS
    const { data: match } = await supabase
      .from('matches')
      .select('status, check_id, notes')
      .eq('id', id)
      .single();
    if (!match) return res.status(404).json({ error: 'Match not found' });

    // Service client for writes — bypasses RLS (auth already verified above)
    const db = createServiceClient();
    const now = new Date().toISOString();

    const { error } = await db
      .from('matches')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: now,
        notes: notes || match.notes,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) return res.status(500).json({ error: error.message });

    // Sync the parent check so the matching algorithm won't re-process it.
    const syncCheck = async () => {
      if (!match.check_id) return;
      const { data: checkRow } = await db
        .from('checks')
        .update({ status: 'approved' })
        .eq('id', match.check_id)
        .eq('tenant_id', tenantId)
        .select('job_id, check_id')
        .maybeSingle();
      // ...and in checks_data, so the dashboard and the extension agree.
      if (checkRow) {
        await patchJobCheck(db, tenantId, checkRow.job_id, checkRow.check_id, (c) => ({ ...c, status: 'approved' }))
          .catch(() => false);
      }
    };

    // Independent writes after the match row is committed: run them together.
    await Promise.all([
      syncCheck(),
      audit(db, id as string, userId, 'approved', match.status, 'approved', { notes }),
    ]);

    return res.status(200).json({ success: true, status: 'approved', approved_at: now, approved_by: userId });
  } catch (error: any) {
    console.error('Approve error:', error);
    return res.status(500).json({ error: error.message });
  }
}
