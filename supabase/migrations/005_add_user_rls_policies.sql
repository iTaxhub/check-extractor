-- ============================================================================
-- Add User-Level Row-Level Security Policies
-- Ensures each user can ONLY see their own tenant's data
-- ============================================================================

-- Drop existing service-only policies (these allow everything)
DROP POLICY IF EXISTS "service_all" ON tenants;
DROP POLICY IF EXISTS "service_all" ON profiles;
DROP POLICY IF EXISTS "service_all" ON tenant_settings;
DROP POLICY IF EXISTS "service_all" ON check_jobs;
DROP POLICY IF EXISTS "service_all" ON checks;
DROP POLICY IF EXISTS "service_all" ON export_history;
DROP POLICY IF EXISTS "service_all" ON audit_logs;
DROP POLICY IF EXISTS "service_all" ON accounting_connections;
DROP POLICY IF EXISTS "service_all" ON team_invitations;

-- ══════════════════════════════════════════════════════════════════════════════
-- Helper function to get current user's tenant_id
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════════════════════
-- TENANTS - Users can only see their own tenant
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view own tenant"
  ON tenants FOR SELECT
  USING (id = auth.user_tenant_id());

CREATE POLICY "Users can update own tenant"
  ON tenants FOR UPDATE
  USING (id = auth.user_tenant_id())
  WITH CHECK (id = auth.user_tenant_id());

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access to tenants"
  ON tenants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- PROFILES - Users can only see profiles in their tenant
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR tenant_id = auth.user_tenant_id());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Service role full access to profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- TENANT SETTINGS - Users can only see their tenant's settings
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view own tenant settings"
  ON tenant_settings FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Admins can update tenant settings"
  ON tenant_settings FOR UPDATE
  USING (
    tenant_id = auth.user_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    tenant_id = auth.user_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role full access to tenant_settings"
  ON tenant_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECK JOBS - Users can only see their tenant's jobs
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view own tenant jobs"
  ON check_jobs FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Users can insert jobs for own tenant"
  ON check_jobs FOR INSERT
  WITH CHECK (tenant_id = auth.user_tenant_id());

CREATE POLICY "Users can update own tenant jobs"
  ON check_jobs FOR UPDATE
  USING (tenant_id = auth.user_tenant_id())
  WITH CHECK (tenant_id = auth.user_tenant_id());

CREATE POLICY "Users can delete own tenant jobs"
  ON check_jobs FOR DELETE
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Service role full access to check_jobs"
  ON check_jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- CHECKS - Users can only see their tenant's checks
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view own tenant checks"
  ON checks FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Users can insert checks for own tenant"
  ON checks FOR INSERT
  WITH CHECK (tenant_id = auth.user_tenant_id());

CREATE POLICY "Users can update own tenant checks"
  ON checks FOR UPDATE
  USING (tenant_id = auth.user_tenant_id())
  WITH CHECK (tenant_id = auth.user_tenant_id());

CREATE POLICY "Users can delete own tenant checks"
  ON checks FOR DELETE
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Service role full access to checks"
  ON checks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- EXPORT HISTORY - Users can only see their tenant's exports
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view own tenant exports"
  ON export_history FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Users can insert exports for own tenant"
  ON export_history FOR INSERT
  WITH CHECK (tenant_id = auth.user_tenant_id());

CREATE POLICY "Service role full access to export_history"
  ON export_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOGS - Users can only see their tenant's audit logs
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view own tenant audit logs"
  ON audit_logs FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Users can insert audit logs for own tenant"
  ON audit_logs FOR INSERT
  WITH CHECK (tenant_id = auth.user_tenant_id());

CREATE POLICY "Service role full access to audit_logs"
  ON audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- ACCOUNTING CONNECTIONS - Users can only see their tenant's connections
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view own tenant connections"
  ON accounting_connections FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Admins can manage tenant connections"
  ON accounting_connections FOR ALL
  USING (
    tenant_id = auth.user_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    tenant_id = auth.user_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role full access to accounting_connections"
  ON accounting_connections FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- TEAM INVITATIONS - Users can only see their tenant's invitations
-- ══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view own tenant invitations"
  ON team_invitations FOR SELECT
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Admins can manage team invitations"
  ON team_invitations FOR ALL
  USING (
    tenant_id = auth.user_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    tenant_id = auth.user_tenant_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role full access to team_invitations"
  ON team_invitations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- INTEGRATIONS TABLE (QuickBooks, etc.)
-- ══════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Service role can manage integrations" ON integrations;

CREATE POLICY "Users can view own integrations"
  ON integrations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own integrations"
  ON integrations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access to integrations"
  ON integrations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- QB ENTRIES TABLE (QuickBooks transaction data)
-- ══════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Service role can manage qb_entries" ON qb_entries;

CREATE POLICY "Users can view own qb entries"
  ON qb_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own qb entries"
  ON qb_entries FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access to qb_entries"
  ON qb_entries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- STORAGE POLICIES - Users can only access their tenant's files
-- ══════════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "public_read_checks" ON storage.objects;
DROP POLICY IF EXISTS "public_write_checks" ON storage.objects;
DROP POLICY IF EXISTS "public_update_checks" ON storage.objects;
DROP POLICY IF EXISTS "public_delete_checks" ON storage.objects;

-- Users can read files in their tenant folder
CREATE POLICY "Users can read own tenant files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'checks' AND
    (storage.foldername(name))[1] = auth.user_tenant_id()::text
  );

-- Users can upload files to their tenant folder
CREATE POLICY "Users can upload to own tenant folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'checks' AND
    (storage.foldername(name))[1] = auth.user_tenant_id()::text
  );

-- Users can update files in their tenant folder
CREATE POLICY "Users can update own tenant files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'checks' AND
    (storage.foldername(name))[1] = auth.user_tenant_id()::text
  )
  WITH CHECK (
    bucket_id = 'checks' AND
    (storage.foldername(name))[1] = auth.user_tenant_id()::text
  );

-- Users can delete files in their tenant folder
CREATE POLICY "Users can delete own tenant files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'checks' AND
    (storage.foldername(name))[1] = auth.user_tenant_id()::text
  );

-- Service role can access all files
CREATE POLICY "Service role full access to storage"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'checks')
  WITH CHECK (bucket_id = 'checks');

-- ══════════════════════════════════════════════════════════════════════════════
-- GRANT USAGE ON HELPER FUNCTION
-- ══════════════════════════════════════════════════════════════════════════════
GRANT EXECUTE ON FUNCTION auth.user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_tenant_id() TO service_role;
