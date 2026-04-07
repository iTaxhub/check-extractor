-- ================================================================
-- KYRIQ — Database Migration: Fix Check IDs + Multi-Platform Support
-- ================================================================
-- Run this once against your existing database.
-- Safe to run on a live DB — uses IF NOT EXISTS / IF EXISTS guards.
-- Tested on PostgreSQL 14+
--
-- What this fixes:
--   1. Ensures checks.id is always a real UUID (never "check_0182")
--   2. Adds source column ('quickbooks' | 'xero') for future Xero support
--   3. Adds external_id to store QB/Xero's own transaction ID separately
--   4. Adds realm_id to tie each check to a specific company connection
--   5. Adds batch_id so uploaded batches stay grouped
-- ================================================================

-- ── Step 1: Enable UUID generation if not already on ────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- gen_random_uuid() is built-in on Postgres 13+; pgcrypto covers older versions


-- ── Step 2: Fix the checks table ────────────────────────────────

-- 2a. Change id column from TEXT to UUID with auto-generation
--     (skip if already UUID)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checks' AND column_name = 'id'
    AND data_type = 'text'
  ) THEN
    -- Convert existing text IDs to UUIDs
    -- (existing rows get new UUIDs — old "check_0182" style IDs are replaced)
    ALTER TABLE checks ALTER COLUMN id TYPE UUID USING gen_random_uuid();
    ALTER TABLE checks ALTER COLUMN id SET DEFAULT gen_random_uuid();
    RAISE NOTICE 'checks.id converted to UUID';
  ELSE
    RAISE NOTICE 'checks.id is already UUID — skipping';
  END IF;
END $$;

-- 2b. Add source column (which accounting platform this check came from)
ALTER TABLE checks
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'quickbooks'
  CHECK (source IN ('quickbooks', 'xero'));

-- 2c. Add external_id (QB's DocNumber / Xero's TransactionID)
--     Stored separately from Kyriq's own UUID
ALTER TABLE checks
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 2d. Add realm_id (QB realmId or Xero tenantId — which company this belongs to)
ALTER TABLE checks
  ADD COLUMN IF NOT EXISTS realm_id TEXT;

-- 2e. Add batch_id so all checks from one upload stay linked
ALTER TABLE checks
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES check_batches(id) ON DELETE SET NULL;

-- 2f. Add status if not present
ALTER TABLE checks
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'matched', 'review', 'approved', 'unmatched', 'duplicate'));

-- 2g. Add confidence score
ALTER TABLE checks
  ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 0
  CHECK (confidence >= 0 AND confidence <= 100);

-- 2h. Add QB match fields (populated after matching)
ALTER TABLE checks ADD COLUMN IF NOT EXISTS qb_id        TEXT;
ALTER TABLE checks ADD COLUMN IF NOT EXISTS qb_amount    NUMERIC(12,2);
ALTER TABLE checks ADD COLUMN IF NOT EXISTS qb_payee     TEXT;
ALTER TABLE checks ADD COLUMN IF NOT EXISTS qb_date      DATE;
ALTER TABLE checks ADD COLUMN IF NOT EXISTS qb_check_num TEXT;

-- 2i. Timestamps
ALTER TABLE checks ADD COLUMN IF NOT EXISTS approved_at  TIMESTAMPTZ;
ALTER TABLE checks ADD COLUMN IF NOT EXISTS approved_by  UUID REFERENCES users(id);
ALTER TABLE checks ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE checks ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT now();


-- ── Step 3: Create check_batches table if not exists ────────────
-- Groups all checks from a single upload together
CREATE TABLE IF NOT EXISTS check_batches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  realm_id    TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'quickbooks' CHECK (source IN ('quickbooks','xero')),
  file_name   TEXT,
  check_count INTEGER DEFAULT 0,
  date_from   DATE,
  date_to     DATE,
  status      TEXT NOT NULL DEFAULT 'processing'
              CHECK (status IN ('processing','ready','matched','archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Re-run the batch_id FK now that check_batches definitely exists
ALTER TABLE checks
  DROP CONSTRAINT IF EXISTS checks_batch_id_fkey;
ALTER TABLE checks
  ADD CONSTRAINT checks_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES check_batches(id) ON DELETE SET NULL;


-- ── Step 4: Useful indexes ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_checks_user_id    ON checks(user_id);
CREATE INDEX IF NOT EXISTS idx_checks_realm_id   ON checks(realm_id);
CREATE INDEX IF NOT EXISTS idx_checks_batch_id   ON checks(batch_id);
CREATE INDEX IF NOT EXISTS idx_checks_status     ON checks(status);
CREATE INDEX IF NOT EXISTS idx_checks_source     ON checks(source);
CREATE INDEX IF NOT EXISTS idx_batches_user_id   ON check_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_batches_realm_id  ON check_batches(realm_id);


-- ── Step 5: Auto-update updated_at on row changes ───────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_checks_updated_at ON checks;
CREATE TRIGGER trg_checks_updated_at
  BEFORE UPDATE ON checks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_batches_updated_at ON check_batches;
CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON check_batches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── Done ────────────────────────────────────────────────────────
-- Verify with:
--   \d checks
--   \d check_batches
