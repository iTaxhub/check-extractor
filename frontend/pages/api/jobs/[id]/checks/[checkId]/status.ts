import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';

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

  const { status } = req.body || {};
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

    // Fetch job — try job_id column first, fall back to UUID id column
    let { data: job } = await supabase
      .from('jobs')
      .select('id, job_id, checks, checks_data')
      .eq('job_id', jobId)
      .maybeSingle();

    if (!job) {
      const { data: jobById, error: jobByIdErr } = await supabase
        .from('jobs')
        .select('id, job_id, checks, checks_data')
        .eq('id', jobId)
        .maybeSingle();
      if (jobByIdErr) return res.status(500).json({ error: jobByIdErr.message });
      job = jobById;
    }

    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Resolve array — same fallback priority as GET_CHECKS and fields.ts
    const checksData: any[] = Array.isArray(job.checks)
      ? job.checks
      : Array.isArray(job.checks_data)
        ? job.checks_data
        : (typeof job.checks_data === 'string' ? JSON.parse(job.checks_data || '[]') : []);

    const checksCol = Array.isArray(job.checks) ? 'checks' : 'checks_data';

    const checkIdx = checksData.findIndex(
      (c: any) => c.check_id === checkId || c.id === checkId
    );

    if (checkIdx === -1) {
      return res.status(404).json({ error: `Check "${checkId}" not found in job` });
    }

    const check = { ...checksData[checkIdx], status, updated_at: new Date().toISOString() };
    checksData[checkIdx] = check;

    const { error: patchErr } = await supabase
      .from('jobs')
      .update({ [checksCol]: checksData, updated_at: new Date().toISOString() })
      .eq('id', job.id);

    if (patchErr) {
      console.error('Failed to patch check status:', patchErr);
      return res.status(500).json({ error: patchErr.message });
    }

    // Best-effort audit log
    try {
      await supabase.from('audit_logs').insert({
        check_id: checkId,
        job_id: jobId,
        action: status,
        field: 'status',
        new_value: status,
        user_id: user.id,
      });
    } catch (_) {
      // Non-critical
    }

    return res.status(200).json({ success: true, status, message: `Check status updated to "${status}"` });
  } catch (error: any) {
    console.error('PATCH check status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update check status' });
  }
}
