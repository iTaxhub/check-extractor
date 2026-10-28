-- 052: realtime for the core tables, hot-path indexes, and match_status_counts().
--
-- WHY: the app now refreshes from postgres_changes instead of tight polling
-- (frontend/hooks/useRealtimeTable.ts): check_jobs (upload / processing /
-- dashboard), checks (processing), batches (match progress) and qb_connections
-- (company switcher). Realtime only emits rows for tables in the
-- `supabase_realtime` publication. `matches` was published by 039.
--
-- SAFETY: realtime evaluates each table's SELECT policy per row as the
-- connected user. Every table here has a tenant-scoped SELECT policy:
--   check_jobs     009  USING (tenant_id = public.user_tenant_id())
--   checks         008  USING (tenant_id = public.user_tenant_id())
--   batches        032  USING (tenant_id = public.user_tenant_id())
--   qb_connections 013  USING (tenant_id = public.user_tenant_id())
-- The block below re-checks that at run time and SKIPS (with a warning) any
-- table whose RLS is off, that has no tenant-scoped SELECT policy, or that has
-- a permissive USING (true) policy for non-service roles (the old 001
-- `service_all` shape) — publishing that would broadcast every firm's rows.
--
-- The app works without this migration: subscriptions simply never fire and
-- the fallback polls carry on; /api/matches falls back when the RPC is absent.
--
-- Idempotent: safe to run repeatedly.

-- ── 1. Publication ──────────────────────────────────────────────────────────
DO $$
DECLARE
    t text;
    v_rls boolean;
    v_tenant_policies int;
    v_open_policies int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    FOREACH t IN ARRAY ARRAY['check_jobs', 'checks', 'batches', 'qb_connections'] LOOP
        IF to_regclass('public.' || t) IS NULL THEN
            RAISE WARNING '052: public.% absent, not published', t;
            CONTINUE;
        END IF;

        SELECT c.relrowsecurity INTO v_rls
          FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relname = t;

        SELECT count(*) INTO v_tenant_policies
          FROM pg_policies
         WHERE schemaname = 'public' AND tablename = t
           AND cmd IN ('SELECT', 'ALL') AND qual ILIKE '%tenant_id%';

        SELECT count(*) INTO v_open_policies
          FROM pg_policies
         WHERE schemaname = 'public' AND tablename = t
           AND cmd IN ('SELECT', 'ALL')
           AND permissive = 'PERMISSIVE'
           AND btrim(coalesce(qual, '')) IN ('true', '(true)')
           AND NOT (roles <@ ARRAY['service_role']::name[]);

        IF NOT v_rls OR v_tenant_policies = 0 OR v_open_policies > 0 THEN
            RAISE WARNING '052: NOT publishing public.% (rls=%, tenant SELECT policies=%, open policies=%)',
                t, v_rls, v_tenant_policies, v_open_policies;
            CONTINUE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
             WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
            RAISE NOTICE '052: added public.% to supabase_realtime', t;
        END IF;
    END LOOP;
END $$;
-- Replica identity is left at DEFAULT on purpose: the client filters
-- (job_id=eq., id=eq., batch_id=eq.) are evaluated on the NEW row for INSERT and
-- UPDATE, which is what the app listens for. FULL on check_jobs would write its
-- whole checks_data JSON to WAL on every progress update.

-- ── 2. Hot-path indexes ─────────────────────────────────────────────────────
-- Guarded per column, so a database missing an earlier optional migration
-- (e.g. 032 batches) still applies the rest.
DO $$
DECLARE
    spec record;
BEGIN
    FOR spec IN
        SELECT * FROM (VALUES
            ('idx_matches_batch_status_conf', 'matches', ARRAY['batch_id','status','confidence_score'], NULL::text),
            ('idx_matches_tenant_realm_status_conf', 'matches', ARRAY['tenant_id','realm_id','status','confidence_score'], NULL),
            ('idx_qb_connections_tenant_active', 'qb_connections', ARRAY['tenant_id'], 'is_active'),
            ('idx_checks_tenant_job', 'checks', ARRAY['tenant_id','job_id'], NULL),
            ('idx_qb_entries_tenant_realm', 'qb_entries', ARRAY['tenant_id','realm_id'], NULL)
        ) AS s(name, tbl, cols, pred)
    LOOP
        IF to_regclass('public.' || spec.tbl) IS NULL THEN
            RAISE WARNING '052: public.% absent, index % skipped', spec.tbl, spec.name;
            CONTINUE;
        END IF;
        IF (SELECT count(*) FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = spec.tbl
               AND column_name = ANY (spec.cols || coalesce(ARRAY[spec.pred], '{}'::text[])))
           < cardinality(spec.cols) + (spec.pred IS NOT NULL)::int THEN
            RAISE WARNING '052: public.% lacks a column for %, skipped', spec.tbl, spec.name;
            CONTINUE;
        END IF;
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS %I ON public.%I (%s)%s',
            spec.name, spec.tbl,
            (SELECT string_agg(format('%I', c), ', ') FROM unnest(spec.cols) AS c),
            CASE WHEN spec.pred IS NULL THEN '' ELSE format(' WHERE %I', spec.pred) END
        );
    END LOOP;
END $$;

-- ── 3. match_status_counts(): the Review tab/chip counts as one GROUP BY ────
-- SECURITY INVOKER: runs under the caller's RLS, exactly like the old
-- client-side count it replaces in pages/api/matches/index.ts.
CREATE OR REPLACE FUNCTION public.match_status_counts(
    p_tenant uuid,
    p_realm  text,
    p_batch  uuid DEFAULT NULL
)
RETURNS TABLE (status text, n bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT m.status::text, count(*)::bigint
      FROM public.matches m
     WHERE m.tenant_id = p_tenant
       AND m.realm_id  = p_realm
       AND (p_batch IS NULL OR m.batch_id = p_batch)
     GROUP BY m.status;
$$;

GRANT EXECUTE ON FUNCTION public.match_status_counts(uuid, text, uuid) TO authenticated, service_role;

-- Verification:
--   SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
--   SELECT * FROM public.match_status_counts('<tenant>'::uuid, '<realm>');
