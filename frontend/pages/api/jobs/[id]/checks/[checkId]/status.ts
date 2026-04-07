import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';
import { clearQBTransactionServer } from '@/pages/api/qbo/clear-transaction';

/**
 * PATCH /api/jobs/[id]/checks/[checkId]/status
 *
 * Updates the status field on a single check stored inside jobs.checks / jobs.checks_data JSON.
 * `id`      = job_id string (e.g. "job_abc123") OR jobs.id UUID
 * `checkId` = internal check ID such as "check_0213" (NOT a UUID)
 *
 * Called by the Chrome extension UPDATE_CHECK_STATUS handler (approve / reject / undo).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id: jobId, checkId } = req.query;
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'jobId is required' });
  }
  if (!checkId || typeof checkId !== 'string') {
    return res.status(400).json({ error: 'checkId is required' });
  }

  const { status, qbEntryId } = req.body || {};
  if (!status || typeof status !== 'string') {
    return res.status(400).json({ error: 'status is required' });
  }

  const VALID_STATUSES = ['approved', 'rejected', 'pending', 'pending_review', 'processing', 'exported', 'error'];
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  try {
    const supabase = createAuthenticatedClient(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    // Fetch job — live table is check_jobs (not 'jobs'); try job_id column first, fall back to integer PK
    let { data: job } = await supabase
      .from('check_jobs')
      .select('id, job_id, checks_data')
      .eq('job_id', jobId)
      .maybeSingle();

    if (!job) {
      const { data: jobById, error: jobByIdErr } = await supabase
        .from('check_jobs')
        .select('id, job_id, checks_data')
        .eq('id', jobId)
        .maybeSingle();
      if (jobByIdErr) return res.status(500).json({ error: jobByIdErr.message });
      job = jobById;
    }

    if (!job) return res.status(404).json({ error: 'Job not found' });

    // check_jobs only has checks_data (no 'checks' column)
    const checksData: any[] = Array.isArray(job.checks_data)
      ? job.checks_data
      : (typeof job.checks_data === 'string' ? JSON.parse(job.checks_data || '[]') : []);

    const checksCol = 'checks_data';

    const checkIdx = checksData.findIndex(
      (c: any) => c.check_id === checkId || c.id === checkId
    );

    if (checkIdx === -1) {
      return res.status(404).json({ error: `Check "${checkId}" not found in job` });
    }

    const check = { ...checksData[checkIdx], status, updated_at: new Date().toISOString() };
    checksData[checkIdx] = check;

    const { error: patchErr } = await supabase
      .from('check_jobs')
      .update({ [checksCol]: checksData, updated_at: new Date().toISOString() })
      .eq('id', job.id);

    if (patchErr) {
      console.error('Failed to patch check status:', patchErr);
      return res.status(500).json({ error: patchErr.message });
    }

    // Best-effort audit log — check_id must be UUID; use metadata for text check_id
    try {
      await supabase.from('audit_logs').insert({
        tenant_id: (await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).maybeSingle()).data?.tenant_id,
        action: status,
        entity_type: 'check',
        user_id: user.id,
        metadata: { check_id: checkId, job_id: jobId, field: 'status', new_value: status },
      });
    } catch (_) {
      // Non-critical
    }

    // QB clear — non-blocking: approval already saved; QB failure just sets qbSync.status = 'failed'
    let qbSync: { status: 'cleared' | 'failed' | 'skipped'; message?: string } = { status: 'skipped' };
    if (status === 'approved' && qbEntryId && typeof qbEntryId === 'string') {
      try {
        const clearResult = await clearQBTransactionServer(supabase, qbEntryId);
        qbSync = clearResult.cleared
          ? { status: 'cleared' }
          : { status: 'failed', message: clearResult.warning };
      } catch (qbErr: any) {
        qbSync = { status: 'failed', message: qbErr.message };
      }
    }

    return res.status(200).json({ success: true, status, message: `Check status updated to "${status}"`, qbSync });
  } catch (error: any) {
    console.error('PATCH check status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update check status' });
  }
}
