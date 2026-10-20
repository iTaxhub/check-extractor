-- ============================================================================
-- 044: check_jobs.doc_kind — what an upload turned out to be
--
-- The upload page already classifies each file (frontend/lib/document-kind.ts)
-- but never saved the verdict, so History and Reports could not tell a bank
-- statement from a sheet of cheque images. The backend now computes the same
-- verdict at upload-analyze time (backend/doc_kind.py) and stores it here.
-- Nullable: rows that predate this migration stay NULL and render as unknown.
-- Idempotent.
-- ============================================================================

ALTER TABLE public.check_jobs ADD COLUMN IF NOT EXISTS doc_kind TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_jobs_doc_kind_check'
          AND conrelid = 'public.check_jobs'::regclass
    ) THEN
        ALTER TABLE public.check_jobs
            ADD CONSTRAINT check_jobs_doc_kind_check
            CHECK (doc_kind IS NULL OR doc_kind IN
                ('cheque-sheet', 'bank-statement', 'single-cheque', 'no-cheques'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_check_jobs_tenant_doc_kind
    ON public.check_jobs (tenant_id, doc_kind);

COMMENT ON COLUMN public.check_jobs.doc_kind IS
    'Detected document kind, same vocabulary as frontend/lib/document-kind.ts. NULL = classified before migration 044.';
