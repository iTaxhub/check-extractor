-- Add qb_source to qb_transactions for entity-type filtering
-- Values: 'cheque_written' | 'bill_paid_by_cheque' | 'payroll_check'
-- Derived from txn_type when not explicitly provided (backward compatible)

ALTER TABLE public.qb_transactions
  ADD COLUMN IF NOT EXISTS qb_source TEXT;

CREATE INDEX IF NOT EXISTS idx_qb_transactions_qb_source ON qb_transactions(qb_source);

-- Back-fill existing rows from txn_type so nothing is null
UPDATE public.qb_transactions
SET qb_source = CASE
  WHEN txn_type = 'Purchase'    THEN 'cheque_written'
  WHEN txn_type = 'BillPayment' THEN 'bill_paid_by_cheque'
  WHEN txn_type = 'Check'       THEN 'payroll_check'
  ELSE NULL
END
WHERE qb_source IS NULL;
