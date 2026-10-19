'use client';

import { AlertTriangle, FileWarning } from 'lucide-react';
import {
  Dialog,
  GlassPanel,
  StatusPill,
  Badge,
  type StatusKey,
} from '@/components/ui';
import CheckImageViewer from '@/app/(app)/review/[id]/components/CheckImageViewer';
import { cn } from '@/lib/utils';

/**
 * Side-by-side review: the scanned cheque on the left, the QuickBooks record it
 * was matched to on the right.
 *
 * Reuse, not a third viewer. The zoom/rotate viewer already exists at
 * app/(app)/review/[id]/components/CheckImageViewer.tsx and is imported here
 * verbatim — two image viewers in one product is how they start disagreeing
 * about what "100%" means.
 *
 * Blur budget: ONE surface, the Dialog panel (`glass-modal`). The viewer's own
 * shell is a GlassCard, which inside a modal would be a second stacked
 * backdrop-filter, so it is rendered with `inset` — the one prop added to it —
 * and comes through as a non-blurring panel. The comparison side is a
 * GlassPanel and the field rows are plain divs. Nothing here renders per match
 * row: the modal is mounted once, for the one row the user opened.
 */

/** Field rows. One recipe, so the two columns cannot drift in height. */
const FIELD_ROW = 'grid grid-cols-[auto_1fr_1fr] items-baseline gap-3 px-3 py-1.5';

/** Aliases, not new colours: `discrepancy` and `flagged` are NOT StatusPill
 *  keys, so they map onto keys that are — the same aliasing MatchRow does. */
const PILL: Record<string, StatusKey> = {
  matched: 'matched',
  approved: 'approved',
  pending: 'pending',
  discrepancy: 'error',
  unmatched: 'unmatched',
  flagged: 'review',
};

function fmt(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const iso = String(d).slice(0, 10);
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(d);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Row({
  label,
  left,
  right,
  money,
  differs,
}: {
  label: string;
  left: React.ReactNode;
  right: React.ReactNode;
  money?: boolean;
  differs?: boolean;
}) {
  /* State is a tint plus an inset shadow, never a border-width change: a
     thicker border on a differing row would shift every value beside it. */
  return (
    <div
      className={cn(FIELD_ROW, differs && 'bg-error-bg/35 shadow-[inset_3px_0_0_0_hsl(var(--error))]')}
    >
      <span className="w-20 shrink-0 text-eyebrow text-ink-faint">{label}</span>
      <span className={cn('min-w-0 break-words font-medium text-ink-strong', money && 'nums-money')}>
        {left}
      </span>
      <span
        className={cn(
          'min-w-0 break-words font-medium',
          money && 'nums-money',
          differs ? 'text-error-text' : 'text-ink-strong'
        )}
      >
        {right}
      </span>
    </div>
  );
}

/** Which compared fields disagree. One definition, shared by the field tints,
 *  the plain-language mismatch list and the queue's Issue column. */
function diffs(match: any) {
  const { check, qb_txn } = match || {};
  const both = Boolean(check && qb_txn);
  return {
    amount: both && Number(check.amount) !== Number(qb_txn.amount),
    number: both && String(check.check_number ?? '') !== String(qb_txn.doc_number ?? ''),
    date:
      both &&
      String(check.check_date ?? '').slice(0, 10) !== String(qb_txn.txn_date ?? '').slice(0, 10),
  };
}

/** Short label for the queue's Issue column. */
export function issueLabel(match: any): string {
  const d = diffs(match);
  if (!match?.qb_txn) return 'No QuickBooks match';
  if (d.amount) return 'Amount differs';
  if (d.number) return 'Number differs';
  if (d.date) return 'Date differs';
  if (match.flagged_reason || match.status === 'flagged') return 'Flagged';
  if (match.status === 'pending') return 'Awaiting review';
  return match.status ? match.status.charAt(0).toUpperCase() + match.status.slice(1) : 'Review';
}

/** The specific mismatch, in words. */
export function mismatchSentences(match: any): string[] {
  const { check, qb_txn, flagged_reason } = match || {};
  const d = diffs(match);
  const out: string[] = [];
  if (d.amount) out.push(`Amount differs: cheque ${fmt(check?.amount)}, QuickBooks ${fmt(qb_txn?.amount)}.`);
  if (d.number) out.push(`Cheque number differs: #${check?.check_number || '—'} against #${qb_txn?.doc_number || '—'}.`);
  if (d.date) out.push(`Date differs: ${fmtDate(check?.check_date)} against ${fmtDate(qb_txn?.txn_date)}.`);
  if (flagged_reason) out.push(`Flagged: ${flagged_reason}.`);
  return out;
}

export { fmt as formatMoney, fmtDate as formatDate };

/**
 * The evidence itself: scan plus paired values. Rendered inside the modal
 * below 1280px, and inline beside the exception queue at xl. `stacked` puts
 * the scan above the comparison for the narrow side panel.
 */
export function SideBySideEvidence({ match, stacked }: { match: any; stacked?: boolean }) {
  const { check, qb_txn, status, confidence_score, discrepancy_amount, notes } = match || {};
  const { amount: amountDiffers, number: numberDiffers, date: dateDiffers } = diffs(match);
  const sentences = mismatchSentences(match);

  return (
      <div className={cn('grid gap-4', !stacked && 'scroll-region max-h-[72vh] lg:grid-cols-2')}>
        <div className="min-w-0">
          {check?.file_url ? (
            <CheckImageViewer imageUrl={check.file_url} inset />
          ) : (
            <GlassPanel tone="sunken" radius="card" padding="lg" className="text-center">
              <FileWarning className="mx-auto mb-2 h-8 w-8 text-ink-faint" aria-hidden />
              <p className="text-sm font-semibold text-ink-strong">No scan on file</p>
              <p className="mt-1 text-xs text-ink-body">
                This cheque has no stored image, so only the extracted figures can be compared.
              </p>
            </GlassPanel>
          )}
        </div>

        <GlassPanel padding="none" radius="card" className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-glass-hairline px-4 py-3">
            <h3 className="font-heading text-base font-semibold text-ink-strong">Comparison</h3>
            <div className="flex items-center gap-2">
              <Badge
                tone={confidence_score >= 95 ? 'success' : confidence_score >= 75 ? 'warning' : 'error'}
                size="md"
                className="nums font-bold"
              >
                {Math.round(confidence_score || 0)}%
              </Badge>
              <StatusPill status={PILL[status] || 'pending'} label={status} size="sm" />
            </div>
          </div>

          <div className={cn(FIELD_ROW, 'border-b border-glass-hairline')}>
            <span className="w-20 shrink-0" />
            <span className="text-eyebrow text-ink-faint">Cheque</span>
            <span className="text-eyebrow text-ink-faint">QuickBooks</span>
          </div>

          <div className="divide-y divide-glass-hairline">
            <Row
              label="Number"
              left={check?.check_number ? `#${check.check_number}` : '—'}
              right={qb_txn?.doc_number ? `#${qb_txn.doc_number}` : qb_txn?.txn_type || '—'}
              differs={numberDiffers}
            />
            <Row
              label="Date"
              left={fmtDate(check?.check_date)}
              right={fmtDate(qb_txn?.txn_date)}
              differs={dateDiffers}
            />
            <Row
              label="Amount"
              left={fmt(check?.amount)}
              right={fmt(qb_txn?.amount)}
              money
              differs={amountDiffers}
            />
            <Row label="Payee" left={check?.payee || '—'} right={qb_txn?.payee || '—'} />
            <Row label="Memo" left={check?.memo || '—'} right={qb_txn?.memo || '—'} />
            <Row label="Account" left="—" right={qb_txn?.account || '—'} />
          </div>

          {discrepancy_amount > 0 && (
            <div className="flex items-center gap-2 border-t border-glass-hairline bg-error-bg/35 px-4 py-2.5 text-xs font-semibold text-error-text">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              <span className="nums-money">Δ {fmt(discrepancy_amount)} difference</span>
            </div>
          )}

          {sentences.length > 0 && (
            <ul className="space-y-1 border-t border-glass-hairline px-4 py-2.5 text-xs font-medium text-ink-strong">
              {sentences.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}

          {notes && (
            <div className="border-t border-glass-hairline px-4 py-2.5 text-xs text-ink-body">
              <em>{notes}</em>
            </div>
          )}

          {!qb_txn && (
            <div className="border-t border-glass-hairline px-4 py-3 text-xs text-ink-body">
              No QuickBooks transaction is linked yet. Use <strong>Find in QB</strong> or{' '}
              <strong>Create in QB</strong> on the row to link one.
            </div>
          )}
        </GlassPanel>
      </div>
  );
}

export interface SideBySideModalProps {
  match: any;
  onClose: () => void;
}

export default function SideBySideModal({ match, onClose }: SideBySideModalProps) {
  return (
    <Dialog
      open
      onClose={onClose}
      size="full"
      title={`Cheque #${match?.check?.check_number || '—'}`}
      description="The scanned cheque beside the QuickBooks record it was matched to."
    >
      <SideBySideEvidence match={match} />
    </Dialog>
  );
}
