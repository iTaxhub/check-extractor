-- Migration 024: Add cleared_status to qb_transactions
-- Stores QB ClearedStatus ('None', 'Cleared', 'Reconciled') per transaction
-- Used by sync-qb.ts to auto-approve matches for transactions already cleared in QB

ALTER TABLE public.qb_transactions
  ADD COLUMN IF NOT EXISTS cleared_status TEXT;

COMMENT ON COLUMN public.qb_transactions.cleared_status IS
  'QB ClearedStatus value: NULL | None | Cleared | Reconciled';
