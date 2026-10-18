-- ============================================================================
-- 043: check_documents, a RAG-ready row per extracted check
--
-- One row per (tenant, job, check) with the extracted fields, the engine that
-- produced them and a short text summary the voice agent can search. The
-- embedding column is added only when pgvector is available, so this migration
-- runs on a project without the extension too. Idempotent.
--
-- Numbered 043 because 040-042 already exist on main; 040_checks_rag.sql in the
-- plan was renamed to avoid the clash.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.check_documents (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    job_id        TEXT        NOT NULL,
    check_id      TEXT        NOT NULL,
    engine        TEXT        NOT NULL,
    fields        JSONB       NOT NULL DEFAULT '{}'::jsonb,
    summary       TEXT        NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_documents_job_check_engine_key UNIQUE (tenant_id, job_id, check_id, engine)
);

CREATE INDEX IF NOT EXISTS idx_check_documents_tenant_job
    ON public.check_documents (tenant_id, job_id);

-- Vector search only where the extension exists. Done with DO so a project
-- without pgvector still gets the table above.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
        CREATE EXTENSION IF NOT EXISTS vector;
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'check_documents' AND column_name = 'embedding'
        ) THEN
            ALTER TABLE public.check_documents ADD COLUMN embedding vector(1536);
        END IF;
    END IF;
END $$;

ALTER TABLE public.check_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation check_documents select" ON public.check_documents;
CREATE POLICY "Tenant isolation check_documents select"
    ON public.check_documents FOR SELECT
    USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation check_documents insert" ON public.check_documents;
CREATE POLICY "Tenant isolation check_documents insert"
    ON public.check_documents FOR INSERT
    WITH CHECK (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation check_documents update" ON public.check_documents;
CREATE POLICY "Tenant isolation check_documents update"
    ON public.check_documents FOR UPDATE
    USING (tenant_id = public.user_tenant_id())
    WITH CHECK (tenant_id = public.user_tenant_id());
