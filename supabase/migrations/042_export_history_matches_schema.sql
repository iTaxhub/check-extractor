-- 042: make public.export_history match the schema the code was written against.
--
-- SYMPTOM: the Reports page said "Reports are not available yet —
-- public.report_summary() is missing — apply 035". That message was wrong twice
-- over. 035 HAD been applied and the function existed; calling it returned
--
--     42703  column "export_format" does not exist
--
-- and /api/reports/summary classifies a missing *column* with the same
-- isMissingObject() branch as a missing *function*, so it reported the one thing
-- that was not the problem. (The message is left alone here: the branch is a
-- reasonable catch-all, and once this migration runs it stops firing.)
--
-- CAUSE: 001_schema.sql declares export_history.export_format, and 035's
-- report_summary groups by it. The live table instead had export_type, and was
-- missing job_id, check_count and file_name as well. Nothing in the repo ever
-- wrote export_type — it appears in no migration and no application code — so
-- the live table is a hand-made shape that drifted from 001 and was never
-- reconciled, which is the same root cause as the empty migration ledger that
-- 026-041 had to be pushed through.
--
-- RESOLUTION: 001 is canonical. Nothing reads or writes this table yet, and it
-- is empty, so the rename is free. This is the repo's own named defect class —
-- "check table and column names against supabase/migrations/" — so it is fixed
-- in the database rather than by teaching the function the wrong name.
--
-- Idempotent: safe to run repeatedly, and safe on a database that already
-- matches 001 (every branch is guarded).

DO $$
BEGIN
    IF to_regclass('public.export_history') IS NULL THEN
        RAISE WARNING '042: public.export_history absent — nothing to reconcile';
        RETURN;
    END IF;

    -- Rename only when the old name is there AND the new one is not, so this
    -- cannot clobber a correct column or run twice.
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'export_history'
           AND column_name = 'export_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'export_history'
           AND column_name = 'export_format'
    ) THEN
        ALTER TABLE public.export_history RENAME COLUMN export_type TO export_format;
        RAISE NOTICE '042: renamed export_history.export_type -> export_format';
    END IF;

    -- A table that had neither column still needs one, or report_summary fails
    -- exactly as it did before.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'export_history'
           AND column_name = 'export_format'
    ) THEN
        ALTER TABLE public.export_history ADD COLUMN export_format TEXT;
        RAISE NOTICE '042: added missing export_history.export_format';
    END IF;
END $$;

-- The remaining columns 001 declares. Added without NOT NULL: the table is empty
-- today, but a NOT NULL with no default would fail on any row a future rerun
-- found, and nothing depends on their nullability.
ALTER TABLE public.export_history ADD COLUMN IF NOT EXISTS job_id      TEXT;
ALTER TABLE public.export_history ADD COLUMN IF NOT EXISTS check_count INTEGER DEFAULT 0;
ALTER TABLE public.export_history ADD COLUMN IF NOT EXISTS file_name   TEXT;

-- 001 constrains the format to the set the product actually exports. Added only
-- when absent, and NOT VALID so it governs new rows without forcing a scan that
-- could fail on legacy values written under the old column name.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.export_history'::regclass
           AND conname  = 'export_history_export_format_check'
    ) THEN
        ALTER TABLE public.export_history
            ADD CONSTRAINT export_history_export_format_check
            CHECK (export_format IS NULL
                   OR export_format IN ('csv','iif','xero','zoho','excel','qbo_api','sage'))
            NOT VALID;
        RAISE NOTICE '042: added export_format check constraint';
    END IF;
END $$;
