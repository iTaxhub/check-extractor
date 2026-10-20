-- ============================================================================
-- 045: check_jobs.user_id
--
-- backend/api_server.py has written user_id on check_jobs since the usage
-- ledger landed (inserts near lines 1313/1481/1508, updates at 1329/1626), and
-- the startup loader reads it back. The column was never migrated, so on the
-- live project every signed-in upload's insert fails with PGRST204 ("Could not
-- find the 'user_id' column"), the job exists only in one process's memory,
-- and the upload page polls into "Job not found". Idempotent.
-- ============================================================================

ALTER TABLE public.check_jobs
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_check_jobs_tenant_user
    ON public.check_jobs (tenant_id, user_id);

COMMENT ON COLUMN public.check_jobs.user_id IS
    'The signed-in user who uploaded the job; NULL for rows created before migration 045 or by unauthenticated analysis.';
