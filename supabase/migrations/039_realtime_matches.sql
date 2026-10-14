-- 039: publish `matches` for Supabase Realtime.
--
-- WHY: two reviewers from the same accounting firm work one reconciliation
-- batch. The Review step now subscribes to postgres_changes on matches filtered
-- by batch_id (frontend/hooks/useRealtimeMatches.ts). Realtime only emits rows
-- for tables in the `supabase_realtime` publication — without this migration
-- the subscription connects, reports SUBSCRIBED, and silently receives nothing.
-- A 200 from the socket is not proof of delivery.
--
-- SAFETY: realtime honours RLS, evaluating the SELECT policy per row as the
-- connected user. `matches` already has, from 013_qb_multi_company_match.sql:
--     FOR SELECT USING (tenant_id = public.user_tenant_id())
-- so publishing it cannot leak another firm's rows. The block below REFUSES to
-- publish if that guard is ever absent, rather than opening a cross-tenant
-- firehose on a table whose RLS was dropped.
--
-- Idempotent: safe to run repeatedly.

DO $$
DECLARE
    v_rls_enabled boolean;
    v_select_policies int;
BEGIN
    IF to_regclass('public.matches') IS NULL THEN
        RAISE WARNING '039: public.matches absent — skipping realtime publication';
        RETURN;
    END IF;

    SELECT c.relrowsecurity INTO v_rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = 'matches';

    SELECT count(*) INTO v_select_policies
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'matches'
       AND cmd IN ('SELECT', 'ALL')
       AND qual ILIKE '%tenant_id%';

    IF NOT v_rls_enabled OR v_select_policies = 0 THEN
        RAISE EXCEPTION '039: refusing to publish public.matches to realtime — '
            'RLS enabled=%, tenant-scoped SELECT policies=%. Restore the tenant '
            'isolation policy from 013_qb_multi_company_match.sql first.',
            v_rls_enabled, v_select_policies;
    END IF;

    -- Supabase ships this publication; create it on a bare Postgres so the
    -- migration is runnable outside a Supabase project too.
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
        RAISE NOTICE '039: created publication supabase_realtime';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename  = 'matches'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
        RAISE NOTICE '039: added public.matches to supabase_realtime';
    END IF;

    -- UPDATE/DELETE events carry only the primary key in their OLD row under
    -- the default replica identity, which is not enough for realtime to apply
    -- the tenant RLS check or the batch_id filter to them. FULL makes the old
    -- row complete. matches is a review-sized table, so the extra WAL is cheap.
    IF EXISTS (
        SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relname = 'matches'
           AND c.relreplident <> 'f'
    ) THEN
        ALTER TABLE public.matches REPLICA IDENTITY FULL;
    END IF;
END $$;

-- The subscription filters on batch_id; 032 already indexes (batch_id, status).
-- Verification (expect one row):
--   SELECT * FROM pg_publication_tables
--    WHERE pubname = 'supabase_realtime' AND tablename = 'matches';
