import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';

/**
 * Approve or reject one cheque from the review page.
 *
 * The review page has always called this route, but it was never written, so
 * every Approve and Reject 404ed and showed "Rejection failed". Uses the
 * caller's session, so RLS limits it to their firm's cheques.
 */
const STATUS: Record<string, string> = { approve: 'approved', reject: 'rejected' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const action = String(req.body?.action ?? '');
  const status = STATUS[action];
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Check ID is required' });
  }
  if (!status) {
    return res.status(400).json({ error: 'action must be "approve" or "reject"' });
  }

  try {
    const supabase = createAuthenticatedClient(req);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('checks')
      .update({ status, updated_at: now, ...(status === 'approved' ? { approved_at: now } : {}) })
      .eq('id', id)
      .select('id, status')
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // RLS hides other firms' rows: an update that matched nothing is a 404,
    // not a silent success.
    if (!data) {
      return res.status(404).json({ error: 'Cheque not found' });
    }

    try {
      await supabase.from('audit_logs').insert({ check_id: id, action: status, field: 'status', new_value: status });
    } catch {
      // The audit row is best effort; the status change already succeeded.
    }

    return res.status(200).json({ success: true, check: data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to update cheque' });
  }
}
