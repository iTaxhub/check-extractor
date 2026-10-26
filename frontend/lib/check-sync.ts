/**
 * A cheque lives in two places: the flattened `checks` table (review page,
 * reconcile, matching) and `check_jobs.checks_data` (dashboard, QB comparisons,
 * the extension, exports). A route that writes one must write the other, or the
 * app and the extension disagree about the same cheque.
 *
 * patchJobCheck applies `mutate` to one cheque inside checks_data. The caller
 * passes a service client, so the job is scoped to tenantId here by hand.
 * Best effort: returns false instead of throwing when the job or cheque is gone.
 */
export async function patchJobCheck(
  db: any,
  tenantId: string,
  jobId: string | null | undefined,
  checkId: string | null | undefined,
  mutate: (check: any) => any,
): Promise<boolean> {
  if (!tenantId || !jobId || !checkId) return false;
  const { data: job } = await db
    .from('check_jobs')
    .select('id, checks_data')
    .eq('job_id', jobId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!job) return false;

  // Stored as a JSON string by the backend, as an array by these routes.
  const raw = job.checks_data;
  const checks: any[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw || '[]') : [];
  const idx = checks.findIndex((c) => c?.check_id === checkId);
  if (idx === -1) return false;

  checks[idx] = { ...mutate({ ...checks[idx] }), updated_at: new Date().toISOString() };
  const { error } = await db
    .from('check_jobs')
    .update({ checks_data: checks, updated_at: new Date().toISOString() })
    .eq('id', job.id)
    .eq('tenant_id', tenantId);
  return !error;
}

/** Set fields inside check.extraction the way the manual editors do. */
export function withManualFields(check: any, fields: Record<string, unknown>) {
  const ext = { ...(check.extraction || {}) };
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) ext[key] = { value, source: 'manual' };
  }
  return { ...check, extraction: ext };
}
