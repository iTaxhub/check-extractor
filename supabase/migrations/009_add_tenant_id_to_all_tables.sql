-- Add tenant_id to all tables that don't have it and create RLS policies
-- This ensures complete tenant isolation across the entire application

-- ══════════════════════════════════════════════════════════════════════════════
-- ADD TENANT_ID COLUMNS
-- ══════════════════════════════════════════════════════════════════════════════

-- check_jobs already has tenant_id in schema, but ensure it exists
ALTER TABLE public.check_jobs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- app_settings - add tenant_id (currently global, make it per-tenant)
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- export_history already has tenant_id in schema
ALTER TABLE public.export_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- audit_logs already has tenant_id in schema
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- processing_stages - needs tenant_id via check_id relationship
ALTER TABLE public.processing_stages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- integrations - make per-tenant instead of global
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- qbo_connections already has tenant_id in schema
ALTER TABLE public.qbo_connections ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- ASSIGN EXISTING DATA TO TENANTS
-- ══════════════════════════════════════════════════════════════════════════════

-- Assign checks to their uploader's tenant
UPDATE public.checks c
SET tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = c.user_id)
WHERE tenant_id IS NULL AND user_id IS NOT NULL;

-- Assign orphaned checks to first tenant
UPDATE public.checks 
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

-- Assign all check_jobs to first tenant (no user_id column exists)
UPDATE public.check_jobs 
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

-- Assign qb_entries to first tenant (no user_id to reference)
UPDATE public.qb_entries 
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

-- Assign quickbooks_entries to first tenant
UPDATE public.quickbooks_entries 
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

-- Assign app_settings to first tenant
UPDATE public.app_settings 
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

-- Assign integrations to first tenant
UPDATE public.integrations 
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

-- Assign processing_stages via their check's tenant_id
UPDATE public.processing_stages ps
SET tenant_id = (SELECT tenant_id FROM public.checks WHERE id = ps.check_id)
WHERE tenant_id IS NULL AND check_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- ENABLE RLS ON ALL TABLES
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qbo_connections ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════
-- CREATE RLS POLICIES FOR CHECK_JOBS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own tenant check_jobs" ON public.check_jobs;
CREATE POLICY "Users can view own tenant check_jobs"
  ON public.check_jobs FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can insert own tenant check_jobs" ON public.check_jobs;
CREATE POLICY "Users can insert own tenant check_jobs"
  ON public.check_jobs FOR INSERT
  WITH CHECK (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can update own tenant check_jobs" ON public.check_jobs;
CREATE POLICY "Users can update own tenant check_jobs"
  ON public.check_jobs FOR UPDATE
  USING (tenant_id = public.user_tenant_id())
  WITH CHECK (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can delete own tenant check_jobs" ON public.check_jobs;
CREATE POLICY "Users can delete own tenant check_jobs"
  ON public.check_jobs FOR DELETE
  USING (tenant_id = public.user_tenant_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- CREATE RLS POLICIES FOR APP_SETTINGS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own tenant app_settings" ON public.app_settings;
CREATE POLICY "Users can view own tenant app_settings"
  ON public.app_settings FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can update own tenant app_settings" ON public.app_settings;
CREATE POLICY "Users can update own tenant app_settings"
  ON public.app_settings FOR UPDATE
  USING (tenant_id = public.user_tenant_id())
  WITH CHECK (tenant_id = public.user_tenant_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- CREATE RLS POLICIES FOR INTEGRATIONS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own tenant integrations" ON public.integrations;
CREATE POLICY "Users can view own tenant integrations"
  ON public.integrations FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can insert own tenant integrations" ON public.integrations;
CREATE POLICY "Users can insert own tenant integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can update own tenant integrations" ON public.integrations;
CREATE POLICY "Users can update own tenant integrations"
  ON public.integrations FOR UPDATE
  USING (tenant_id = public.user_tenant_id())
  WITH CHECK (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can delete own tenant integrations" ON public.integrations;
CREATE POLICY "Users can delete own tenant integrations"
  ON public.integrations FOR DELETE
  USING (tenant_id = public.user_tenant_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- CREATE RLS POLICIES FOR EXPORT_HISTORY
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own tenant export_history" ON public.export_history;
CREATE POLICY "Users can view own tenant export_history"
  ON public.export_history FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can insert own tenant export_history" ON public.export_history;
CREATE POLICY "Users can insert own tenant export_history"
  ON public.export_history FOR INSERT
  WITH CHECK (tenant_id = public.user_tenant_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- CREATE RLS POLICIES FOR AUDIT_LOGS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own tenant audit_logs" ON public.audit_logs;
CREATE POLICY "Users can view own tenant audit_logs"
  ON public.audit_logs FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can insert own tenant audit_logs" ON public.audit_logs;
CREATE POLICY "Users can insert own tenant audit_logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (tenant_id = public.user_tenant_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- CREATE RLS POLICIES FOR PROCESSING_STAGES
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own tenant processing_stages" ON public.processing_stages;
CREATE POLICY "Users can view own tenant processing_stages"
  ON public.processing_stages FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can insert own tenant processing_stages" ON public.processing_stages;
CREATE POLICY "Users can insert own tenant processing_stages"
  ON public.processing_stages FOR INSERT
  WITH CHECK (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can update own tenant processing_stages" ON public.processing_stages;
CREATE POLICY "Users can update own tenant processing_stages"
  ON public.processing_stages FOR UPDATE
  USING (tenant_id = public.user_tenant_id())
  WITH CHECK (tenant_id = public.user_tenant_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- CREATE RLS POLICIES FOR QBO_CONNECTIONS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own tenant qbo_connections" ON public.qbo_connections;
CREATE POLICY "Users can view own tenant qbo_connections"
  ON public.qbo_connections FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can insert own tenant qbo_connections" ON public.qbo_connections;
CREATE POLICY "Users can insert own tenant qbo_connections"
  ON public.qbo_connections FOR INSERT
  WITH CHECK (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can update own tenant qbo_connections" ON public.qbo_connections;
CREATE POLICY "Users can update own tenant qbo_connections"
  ON public.qbo_connections FOR UPDATE
  USING (tenant_id = public.user_tenant_id())
  WITH CHECK (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Users can delete own tenant qbo_connections" ON public.qbo_connections;
CREATE POLICY "Users can delete own tenant qbo_connections"
  ON public.qbo_connections FOR DELETE
  USING (tenant_id = public.user_tenant_id());
