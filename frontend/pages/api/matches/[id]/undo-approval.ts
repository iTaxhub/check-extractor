import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthContext, audit } from '@/lib/match-helpers';
import { createServiceClient } from '@/lib/supabase/api';
import { patchJobCheck } from '@/lib/check-sync';

/**
 * POST /api/matches/[id]/undo-approval
 * Reverse an approval (put back to previous state)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.query;
    const { supabase, userId, tenantId } = await getAuthContext(req);

    // Auth client read — enforces tenant isolation via RLS
    const { data: match } = await supabase
      .from('matches')
      .select('*, check:checks(*)')
      .eq('id', id)
      .single();
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const revertStatus = match.confidence_score >= 95 ? 'matched' : 'pending';

    // Service client for writes (RLS dropped them silently), scoped to the tenant by hand,
    // as matches/[id]/approve.ts does.
    const db = createServiceClient();
    const { error } = await db
      .from('matches')
      .update({ status: revertStatus, approved_by: null, approved_at: null })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) return res.status(500).json({ error: error.message });

    // Undo the cheque too, in both stores; approve set checks.status = 'approved'.
    const check = match.check;
    if (check?.id) {
      await db.from('checks').update({ status: 'pending_review', approved_at: null })
        .eq('id', check.id).eq('tenant_id', tenantId);
      await patchJobCheck(db, tenantId, check.job_id, check.check_id, (c) => ({ ...c, status: 'pending_review' }))
        .catch(() => false);
    }

    await audit(db, id as string, userId, 'approval_undone', 'approved', revertStatus);

    return res.status(200).json({ success: true, status: revertStatus });
  } catch (error: any) {
    console.error('Undo approval error:', error);
    return res.status(500).json({ error: error.message });
  }
}
