import { ComparisonRow, parseAmount, areDatesSameCalendarDay } from './comparisonUtils';
import { createClient } from '@/lib/supabase/client';

export interface FixCorrections {
  amount?: number;
  txnDate?: string;
  docNumber?: string;
  memo?: string;
}

export interface FixResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  qbFault?: any;
  fields?: FixCorrections;
}

/**
 * Compute the corrections to push to QuickBooks so the QB transaction matches
 * the cheque extraction data. Only includes fields that actually differ.
 *
 * Mirrors the extension's `fixDiscrepancyInQB` corrections logic
 * (chrome-extension/sidepanel/sidepanel.js:fixDiscrepancyInQB).
 */
export function computeCorrections(row: ComparisonRow): FixCorrections {
  const corrections: FixCorrections = {};
  const ext = row.extractionData;
  const qb  = row.qbData;
  if (!ext || !qb) return corrections;

  // Amount
  const extAmt = parseAmount(row.amount);
  const qbAmt  = parseAmount(qb.amount);
  if (extAmt > 0 && Math.abs(extAmt - qbAmt) >= 0.01) {
    corrections.amount = +extAmt.toFixed(2);
  }

  // Date — only push if calendar day differs and ext date is non-empty
  if (row.date && qb.date && !areDatesSameCalendarDay(row.date, qb.date)) {
    // Normalise to YYYY-MM-DD (QBO's expected format)
    const d = new Date(row.date);
    if (!isNaN(d.getTime())) {
      corrections.txnDate = d.toISOString().slice(0, 10);
    }
  }

  // Check number
  const extCN = (row.checkNumber || '').replace(/\D/g, '').replace(/^0+/, '');
  const qbCN  = (qb.checkNumber  || '').replace(/\D/g, '').replace(/^0+/, '');
  if (extCN && extCN !== qbCN) {
    corrections.docNumber = row.checkNumber;
  }

  return corrections;
}

/**
 * POST a correction set to /api/qbo/update-transaction. Uses qb_entries
 * intuit_id + qb_type lookup (the qb-comparisons table populates qbData from
 * qb_entries, which doesn't share IDs with qb_transactions).
 */
export async function applyFixToQB(row: ComparisonRow): Promise<FixResult> {
  const corrections = computeCorrections(row);
  if (Object.keys(corrections).length === 0) {
    return { ok: true, skipped: true, reason: 'No differences detected' };
  }

  const intuitId = row.qbData?.intuit_id;
  const qbType   = row.qbData?.qb_type;
  const qbEntryId = row.qbData?.id;
  if (!intuitId && !qbEntryId) {
    return { ok: false, reason: 'QB transaction has no intuit_id or qb_entries id' };
  }
  if (!qbType && !qbEntryId) {
    return { ok: false, reason: 'QB transaction has no qb_type' };
  }

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    const body: Record<string, any> = { fields: corrections };
    if (intuitId && qbType) {
      body.intuitId = intuitId;
      body.qbType = qbType;
    } else if (qbEntryId) {
      body.qbEntryId = qbEntryId;
    }

    const res = await fetch('/api/qbo/update-transaction', {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        reason: data?.error || `Request failed (${res.status})`,
        qbFault: data?.qbFault,
      };
    }
    return { ok: true, fields: corrections };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'Network error' };
  }
}

export async function applyFixesToQB(
  rows: ComparisonRow[],
  onProgress?: (done: number, total: number, currentRow: ComparisonRow) => void,
): Promise<{ fixed: number; skipped: number; failed: number; errors: string[] }> {
  let fixed = 0, skipped = 0, failed = 0;
  const errors: string[] = [];
  let i = 0;
  for (const row of rows) {
    onProgress?.(i, rows.length, row);
    const r = await applyFixToQB(row);
    if (r.skipped) skipped++;
    else if (r.ok) fixed++;
    else {
      failed++;
      errors.push(`Check #${row.checkNumber || row.id}: ${r.reason}`);
    }
    i++;
  }
  onProgress?.(rows.length, rows.length, rows[rows.length - 1]);
  return { fixed, skipped, failed, errors };
}
