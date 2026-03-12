-- Create table to store vouched (manually approved) check issues
-- Uses composite key of check identifier to track which issues have been vouched
CREATE TABLE IF NOT EXISTS vouched_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Composite identifier for the check (can be from extraction or QB)
  check_identifier TEXT NOT NULL, -- Format: "ext-{job_id}-{check_id}" or "qb-{qb_id}" or "matched-{job_id}-{check_id}"
  check_number TEXT,
  
  -- Vouch metadata
  vouched_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vouched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT, -- Optional reason for vouching
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one vouch per check per tenant
  UNIQUE(tenant_id, check_identifier)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_vouched_checks_tenant ON vouched_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vouched_checks_identifier ON vouched_checks(check_identifier);

-- RLS policies
ALTER TABLE vouched_checks ENABLE ROW LEVEL SECURITY;

-- Users can only see vouched checks for their tenant
CREATE POLICY "Users can view vouched checks for their tenant"
  ON vouched_checks
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenants WHERE tenant_id = (
        SELECT tenant_id FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Users can insert vouched checks for their tenant
CREATE POLICY "Users can vouch checks for their tenant"
  ON vouched_checks
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenants WHERE tenant_id = (
        SELECT tenant_id FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Users can delete their own vouched checks
CREATE POLICY "Users can unvouch checks for their tenant"
  ON vouched_checks
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenants WHERE tenant_id = (
        SELECT tenant_id FROM auth.users WHERE id = auth.uid()
      )
    )
  );
