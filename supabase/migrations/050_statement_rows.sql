-- ============================================================================
-- 047: statement_rows — the cheques a bank statement says went out
--
-- One row per cheque listed on a statement (Bank of America "Checks", Bank of
-- the West "Checks Cleared"), read at upload-analyze time by
-- backend/statement_rows.py: check number (null when the bank prints none),
-- date, amount (positive), payee when present, the page it came from, and how
-- it was read: text layer, OCR of a scanned page, or an AI pass.
-- matched_check_id / match_score are filled by the reconcile step, which pairs
-- each row with a cheque image on the same job.
--
-- Same RLS shape as check_documents (043): every row carries tenant_id and a
-- tenant can only see and change its own. The backend writes with the service
-- role and always sets tenant_id; a row without one is refused by NOT NULL.
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.statement_rows (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID          NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    job_id           TEXT          NOT NULL,
    page             INTEGER       NOT NULL CHECK (page >= 1),
    row_index        INTEGER       NOT NULL CHECK (row_index >= 0),
    check_number     TEXT,
    date             DATE,
    amount           NUMERIC(14,2) NOT NULL,
    payee            TEXT,
    source           TEXT          NOT NULL CHECK (source IN ('text', 'ocr', 'ai')),
    matched_check_id TEXT,
    match_score      INTEGER       CHECK (match_score IS NULL OR match_score BETWEEN 0 AND 100),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT statement_rows_job_page_row_key UNIQUE (tenant_id, job_id, page, row_index)
);

CREATE INDEX IF NOT EXISTS idx_statement_rows_tenant_job
    ON public.statement_rows (tenant_id, job_id);

CREATE INDEX IF NOT EXISTS idx_statement_rows_tenant_number
    ON public.statement_rows (tenant_id, check_number)
    WHERE check_number IS NOT NULL;

ALTER TABLE public.statement_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation statement_rows select" ON public.statement_rows;
CREATE POLICY "Tenant isolation statement_rows select"
    ON public.statement_rows FOR SELECT
    USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation statement_rows insert" ON public.statement_rows;
CREATE POLICY "Tenant isolation statement_rows insert"
    ON public.statement_rows FOR INSERT
    WITH CHECK (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation statement_rows update" ON public.statement_rows;
CREATE POLICY "Tenant isolation statement_rows update"
    ON public.statement_rows FOR UPDATE
    USING (tenant_id = public.user_tenant_id())
    WITH CHECK (tenant_id = public.user_tenant_id());

COMMENT ON TABLE public.statement_rows IS
    'Cheques listed on an uploaded bank statement (backend/statement_rows.py). One row per cheque; matched_check_id links it to a cheque image on the same job.';
