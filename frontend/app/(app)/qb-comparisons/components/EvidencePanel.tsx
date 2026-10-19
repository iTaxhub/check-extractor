import React from 'react';
import { X } from 'lucide-react';
import { Button, StatusPill } from '@/components/ui';
import { ComparisonRow, DateFormat, formatCurrency, formatDate } from '../utils/comparisonUtils';
import { MATCH_STATUS, pairedValues } from './ComparisonTable';

interface EvidencePanelProps {
  row: ComparisonRow | null;
  dateFormat: DateFormat;
  onReview: (row: ComparisonRow) => void;
  onClose: () => void;
}

/** Same source order as DetailModal, from data already on the row. */
function imageSrc(ext: NonNullable<ComparisonRow['extractionData']>) {
  if (ext.storage_url) return ext.storage_url;
  if (ext.image_url) return ext.image_url;
  if (ext.image_file?.startsWith('http')) return ext.image_file;
  return `/api/check-image/${ext.job_id}/${ext.check_id}`;
}

/**
 * Evidence for the selected row, beside the grid. Read-only: every decision
 * (approve, reject, fix) happens in the review dialog, never from here.
 */
export const EvidencePanel: React.FC<EvidencePanelProps> = ({ row, dateFormat, onReview, onClose }) => {
  if (!row) {
    return (
      <aside className="hidden w-80 shrink-0 rounded-card border border-glass-hairline bg-surface p-4 text-sm text-ink-soft xl:block">
        Select a row to see the cheque and its QuickBooks values side by side.
      </aside>
    );
  }

  const p = pairedValues(row);
  const off = p.difference !== null && Math.abs(p.difference) >= 0.005;
  const ext = row.extractionData;
  const qb = row.qbData;
  const fmtDate = (d?: string) => (d ? formatDate(d, dateFormat) : '—');

  const pairs: { label: string; cheque: string; qb: string; money?: boolean; bad?: boolean }[] = [
    { label: 'Cheque no.', cheque: ext ? row.checkNumber || '—' : '—', qb: qb?.checkNumber || '—' },
    { label: 'Date', cheque: ext ? fmtDate(row.date) : '—', qb: fmtDate(qb?.date) },
    { label: 'Payee', cheque: ext ? row.payee || '—' : '—', qb: qb?.payee || '—' },
    {
      label: 'Amount',
      cheque: p.extAmount ? formatCurrency(p.extAmount) : '—',
      qb: p.qbAmount ? formatCurrency(p.qbAmount) : '—',
      money: true,
      bad: off,
    },
  ];

  return (
    <aside
      aria-label="Selected comparison"
      className="hidden w-80 shrink-0 flex-col overflow-y-auto rounded-card border border-glass-hairline bg-surface xl:flex"
    >
      <div className="flex items-start justify-between gap-2 border-b border-glass-hairline px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-strong">
            Cheque {row.checkNumber || qb?.checkNumber || '—'}
          </p>
          <div className="mt-1">
            <StatusPill size="sm" status={MATCH_STATUS[row.matchStatus].status} label={MATCH_STATUS[row.matchStatus].label} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Clear selection"
          className="press rounded-full p-1 text-ink-faint hover:text-ink-strong"
        >
          <X size={14} />
        </button>
      </div>

      {ext && (
        <div className="border-b border-glass-hairline p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc(ext)}
            alt={`Cheque ${row.checkNumber || ''}`}
            className="max-h-48 w-full rounded-input object-contain"
          />
        </div>
      )}

      <table className="w-full text-xs">
        <thead>
          <tr className="text-ink-faint">
            <th className="px-4 py-2 text-left font-medium" />
            <th className="px-2 py-2 text-left font-medium">Cheque</th>
            <th className="px-4 py-2 text-left font-medium">QuickBooks</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((pair) => (
            <tr key={pair.label} className="border-t border-glass-hairline">
              <th scope="row" className="px-4 py-1.5 text-left font-medium text-ink-soft">{pair.label}</th>
              <td className={`px-2 py-1.5 text-ink-strong ${pair.money ? 'nums-money' : ''}`}>{pair.cheque}</td>
              <td className={`px-4 py-1.5 ${pair.money ? 'nums-money' : ''} ${pair.bad ? 'font-semibold text-error-text' : 'text-ink-strong'}`}>
                {pair.qb}
              </td>
            </tr>
          ))}
          <tr className="border-t border-glass-hairline">
            <th scope="row" className="px-4 py-1.5 text-left font-medium text-ink-soft">Difference</th>
            <td colSpan={2} className={`nums-money px-2 py-1.5 ${off ? 'font-semibold text-error-text' : 'text-ink-body'}`}>
              {p.difference === null ? '—' : formatCurrency(p.difference)}
            </td>
          </tr>
        </tbody>
      </table>

      {row.issues && row.issues.length > 0 && (
        <ul className="space-y-1 border-t border-glass-hairline px-4 py-3 text-xs text-ink-body">
          {row.issues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      )}

      <div className="mt-auto border-t border-glass-hairline p-3">
        <Button block size="sm" onClick={() => onReview(row)}>
          Review
        </Button>
      </div>
    </aside>
  );
};
