import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthContext, audit } from '@/lib/match-helpers';
import { createServiceClient } from '@/lib/supabase/api';

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
    if (match.check_id) {
      await db
        .from('checks')
        .update({ status: 'approved' })
        .eq('id', match.check_id)
        .eq('tenant_id', tenantId);
    }

    await audit(db, id as string, userId, 'approved', match.status, 'approved', { notes });

    return res.status(200).json({ success: true, status: 'approved' });
  } catch (error: any) {
    console.error('Approve error:', error);
    return res.status(500).json({ error: error.message });
  }
}
