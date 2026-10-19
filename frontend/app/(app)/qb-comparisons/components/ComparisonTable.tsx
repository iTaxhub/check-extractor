import React, { useMemo } from 'react';
import { ChevronUp, ChevronDown, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import {
  Badge,
  StatusPill,
  Table,
  Skeleton,
  TableEmpty,
  TableScroll,
  TableShell,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  type StatusKey,
} from '@/components/ui';
import { ComparisonRow, SortField, SortDirection, formatCurrency, formatDate, parseAmount, DateFormat } from '../utils/comparisonUtils';
import { VisibleColumns } from '../hooks/useComparisonState';

/**
 * The comparison grid. Rules it is held to:
 *
 * 1. Glass is on the SHELL and the STICKY HEADER only, never on a row, so the
 *    number of composited layers does not grow with the row count.
 * 2. Density does not regress. `DENSE_GRID` pins the 22px row in ONE place.
 * 3. No Excel look and no whole-row tint: red marks the specific value that is
 *    wrong (a differing amount, a non-zero difference, an issue), not the row.
 * 4. Columns follow `visibleColumns`; the default set is the review set and
 *    everything else stays reachable through the Columns control.
 */

/* The ONE place this grid's row metrics are declared. */
const DENSE_GRID = [
  'text-[11px]',
  '[&_tbody_tr]:h-[22px]',
  '[&_td]:px-1.5 [&_td]:py-0.5',
  '[&_th]:px-1.5 [&_th]:py-1.5',
].join(' ');

interface ComparisonTableProps {
  data: ComparisonRow[];
  sortField: SortField;
  sortDirection: SortDirection;
  visibleColumns: VisibleColumns;
  dateFormat: DateFormat;
  onSort: (field: SortField) => void;
  /** Selects the row (evidence panel). */
  onRowClick: (row: ComparisonRow) => void;
  /** Opens the full review dialog for a row. */
  onReview: (row: ComparisonRow) => void;
  selectedId?: string | null;
  currentPage: number;
  itemsPerPage: number;
  onVouch: (row: ComparisonRow) => void;
  onUnvouch: (row: ComparisonRow) => void;
  vouchingId: string | null;
  onDeleteQBEntry?: (entryId: string) => void;
  deletingQBEntry?: string | null;
  /** Rendered inside the shell, below the scroll region. */
  footer?: React.ReactNode;
  /** First load: skeleton rows in the real grid, never a false "no records". */
  loading?: boolean;
}

const SortIcon: React.FC<{ field: SortField; sortField: SortField; sortDirection: SortDirection }> = ({
  field,
  sortField,
  sortDirection,
}) => (
  <span className="ml-1 inline-flex flex-col leading-none" aria-hidden>
    <ChevronUp
      className={`h-2.5 w-2.5 ${sortField === field && sortDirection === 'asc' ? 'text-brand-deep' : 'text-ink-faint/40'}`}
    />
    <ChevronDown
      className={`-mt-0.5 h-2.5 w-2.5 ${sortField === field && sortDirection === 'desc' ? 'text-brand-deep' : 'text-ink-faint/40'}`}
    />
  </span>
);

/** Shared status vocabulary; the label is always spelled out. */
export const MATCH_STATUS: Record<ComparisonRow['matchStatus'], { status: StatusKey; label: string }> = {
  matched: { status: 'matched', label: 'Matched' },
  mismatch: { status: 'review', label: 'Mismatch' },
  'missing-in-qb': { status: 'processing', label: 'Missing in QB' },
  'missing-in-extraction': { status: 'failed', label: 'Missing in cheques' },
};

/** The paired values the grid and the evidence panel both read. */
export function pairedValues(row: ComparisonRow) {
  const hasExtraction = Boolean(row.extractionData) || row.source === 'matched';
  const hasQb = Boolean(row.qbData) || row.source === 'matched';
  const extAmount = hasExtraction && row.amount ? row.amount : '';
  const qbAmount = hasQb ? row.qbData?.amount || row.amount || '' : '';
  const difference =
    extAmount && qbAmount ? parseAmount(extAmount) - parseAmount(qbAmount) : null;
  return { hasExtraction, hasQb, extAmount, qbAmount, difference };
}

const isOff = (d: number | null) => d !== null && Math.abs(d) >= 0.005;

const sourceLabel = (qbSource?: string) =>
  qbSource === 'qbo_file_upload' ? 'File' : qbSource?.includes('cheque') ? 'QB API' : qbSource || 'Unknown';

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  data,
  sortField,
  sortDirection,
  visibleColumns: v,
  dateFormat,
  onSort,
  onRowClick,
  onReview,
  selectedId,
  currentPage,
  itemsPerPage,
  onVouch,
  onUnvouch,
  vouchingId,
  onDeleteQBEntry,
  deletingQBEntry,
  footer,
  loading,
}) => {
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const totals = useMemo(() => {
    const checksTotal = data.reduce(
      (sum, row) => (row.extractionData ? sum + parseAmount(row.amount) : sum),
      0
    );
    const qbTotal = data.reduce(
      (sum, row) => (row.qbData ? sum + parseAmount(row.qbData.amount) : sum),
      0
    );
    return { count: data.length, checksTotal, qbTotal, difference: checksTotal - qbTotal };
  }, [data]);

  // Columns before the money block, used for the totals label colspan.
  const lead = [v.checkNumber, v.date, v.payee, v.bankAccount, v.memo].filter(Boolean).length;
  const trail = [v.matchStatus, v.confidence, v.issues, v.qbSource, v.qbType, v.currency, v.pdfName, v.source, v.actions].filter(Boolean).length;
  const colCount = lead + (v.amount ? 3 : 0) + trail || 1;

  return (
    <TableShell className="flex min-h-0 flex-1 flex-col">
      {/* min-h-0 is load-bearing: without it the scroll region refuses to
          shrink and the pagination bar is clipped. */}
      <TableScroll className="min-h-0 max-h-[60vh] flex-1 md:max-h-none">
        <Table className={DENSE_GRID}>
          <Thead>
            <tr>
              {v.checkNumber && (
                <Th sortable onClick={() => onSort('checkNumber')}>
                  Cheque no.
                  <SortIcon field="checkNumber" sortField={sortField} sortDirection={sortDirection} />
                </Th>
              )}
              {v.date && (
                <Th sortable onClick={() => onSort('date')}>
                  Date
                  <SortIcon field="date" sortField={sortField} sortDirection={sortDirection} />
                </Th>
              )}
              {v.payee && (
                <Th sortable onClick={() => onSort('payee')}>
                  Payee
                  <SortIcon field="payee" sortField={sortField} sortDirection={sortDirection} />
                </Th>
              )}
              {v.bankAccount && <Th>Bank / account</Th>}
              {v.memo && <Th>Memo</Th>}
              {v.amount && (
                <>
                  <Th numeric sortable onClick={() => onSort('amount')}>
                    Extracted
                    <SortIcon field="amount" sortField={sortField} sortDirection={sortDirection} />
                  </Th>
                  <Th numeric>QuickBooks</Th>
                  <Th numeric>Difference</Th>
                </>
              )}
              {v.matchStatus && (
                <Th sortable onClick={() => onSort('matchStatus')}>
                  Status
                  <SortIcon field="matchStatus" sortField={sortField} sortDirection={sortDirection} />
                </Th>
              )}
              {v.confidence && <Th numeric>Confidence</Th>}
              {v.issues && <Th>Issues</Th>}
              {v.qbSource && <Th>QB source</Th>}
              {v.qbType && <Th>QB type</Th>}
              {v.currency && <Th>Currency</Th>}
              {v.pdfName && <Th>Document</Th>}
              {v.source && <Th>Found in</Th>}
              {v.actions && <Th className="text-right">Review</Th>}
            </tr>
          </Thead>

          <Tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, r) => (
                <Tr key={`sk-${r}`} aria-hidden>
                  {Array.from({ length: colCount }).map((__, c) => (
                    <Td key={c}><Skeleton shape="line" className="w-full min-w-[2.5rem]" /></Td>
                  ))}
                </Tr>
              ))
            ) : paginatedData.length === 0 ? (
              <TableEmpty
                colSpan={colCount}
                title="No matching records"
                description="Adjust the filters, or sync QuickBooks data to compare against."
              />
            ) : (
              paginatedData.map((row) => {
                const match = MATCH_STATUS[row.matchStatus];
                const p = pairedValues(row);
                const off = isOff(p.difference);
                const qbPayee = row.qbData?.payee;
                const payeeOff =
                  Boolean(row.extractionData && qbPayee && row.payee) &&
                  qbPayee!.trim().toLowerCase() !== row.payee.trim().toLowerCase();

                return (
                  <Tr
                    key={row.id}
                    interactive
                    selected={selectedId === row.id}
                    tabIndex={0}
                    onClick={() => onRowClick(row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onReview(row);
                      else if (e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
                  >
                    {v.checkNumber && (
                      <Td className="nums font-semibold">
                        {row.checkNumber || row.qbData?.checkNumber || '—'}
                      </Td>
                    )}
                    {v.date && (
                      <Td muted className="nums">
                        {row.date || row.qbData?.date ? formatDate(row.date || row.qbData!.date, dateFormat) : '—'}
                      </Td>
                    )}
                    {v.payee && (
                      <Td className="max-w-[200px] truncate" title={payeeOff ? `QuickBooks: ${qbPayee}` : undefined}>
                        {row.payee || qbPayee || '—'}
                        {payeeOff && <span className="ml-1 text-error-text" aria-label="Payee differs in QuickBooks">≠</span>}
                      </Td>
                    )}
                    {v.bankAccount && (
                      <Td muted className="max-w-[140px] truncate">
                        {row.qbData?.account || row.bankAccount || '—'}
                      </Td>
                    )}
                    {v.memo && (
                      <Td muted className="max-w-[160px] truncate" title={row.memo || undefined}>
                        {row.memo || '—'}
                      </Td>
                    )}
                    {v.amount && (
                      <>
                        <Td className="nums-money text-right font-semibold text-ink-strong">
                          {p.extAmount ? formatCurrency(p.extAmount) : <span className="text-ink-faint">—</span>}
                        </Td>
                        <Td className={`nums-money text-right font-semibold ${off ? 'text-error-text' : 'text-ink-strong'}`}>
                          {p.qbAmount ? formatCurrency(p.qbAmount) : <span className="text-ink-faint">—</span>}
                        </Td>
                        <Td className={`nums-money text-right ${off ? 'font-semibold text-error-text' : 'text-ink-faint'}`}>
                          {p.difference === null ? '—' : formatCurrency(p.difference)}
                        </Td>
                      </>
                    )}
                    {v.matchStatus && (
                      <Td>
                        <span className="inline-flex items-center gap-1">
                          <StatusPill size="sm" status={match.status} label={match.label} />
                          {row.isDuplicate && <Badge size="sm" tone="warning">Duplicate</Badge>}
                        </span>
                      </Td>
                    )}
                    {v.confidence && (
                      <Td numeric>
                        {row.confidence !== undefined ? (
                          <span className={row.confidence < 60 ? 'font-semibold text-error-text' : 'text-ink-body'}>
                            {row.confidence}%
                          </span>
                        ) : '—'}
                      </Td>
                    )}
                    {v.issues && (
                      <Td className="max-w-[220px]">
                        {row.issues && row.issues.length > 0 ? (
                          <span className="block truncate text-error-text" title={row.issues.join(' · ')}>
                            {row.issues[0]}
                            {row.issues.length > 1 && (
                              <span className="text-ink-faint"> +{row.issues.length - 1}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </Td>
                    )}
                    {v.qbSource && (
                      <Td>
                        {row.qbData ? (
                          <span className="inline-flex items-center gap-1">
                            <Badge size="sm" tone={row.qbData.qbSource === 'qbo_file_upload' ? 'brand' : 'neutral'}>
                              {sourceLabel(row.qbData.qbSource)}
                            </Badge>
                            {onDeleteQBEntry && row.qbData.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteQBEntry(row.qbData!.id);
                                }}
                                disabled={deletingQBEntry === row.qbData.id}
                                className="press rounded-full p-0.5 text-ink-faint hover:bg-error-bg hover:text-error-text disabled:opacity-disabled"
                                title="Delete this QB entry"
                                aria-label="Delete this QB entry"
                              >
                                {deletingQBEntry === row.qbData.id ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <Trash2 size={10} />
                                )}
                              </button>
                            )}
                          </span>
                        ) : '—'}
                      </Td>
                    )}
                    {v.qbType && <Td muted>{row.qbData?.qb_type || '—'}</Td>}
                    {v.currency && <Td muted>USD</Td>}
                    {v.pdfName && (
                      <Td muted className="max-w-[160px] truncate">{row.extractionData?.pdf_name || '—'}</Td>
                    )}
                    {v.source && (
                      <Td muted>
                        {row.source === 'matched' ? 'Both' : row.source === 'extraction' ? 'Cheques' : 'QuickBooks'}
                      </Td>
                    )}
                    {v.actions && (
                      <Td className="whitespace-nowrap text-right">
                        <span className="inline-flex items-center gap-2">
                          {row.vouched ? (
                            <>
                              <span className="inline-flex items-center gap-0.5 font-semibold text-success-text">
                                <CheckCircle size={10} aria-hidden />
                                Vouched
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUnvouch(row);
                                }}
                                disabled={vouchingId === row.id}
                                className="font-medium text-ink-soft underline hover:text-ink-strong disabled:opacity-disabled"
                                title="Remove vouch"
                              >
                                {vouchingId === row.id ? <Loader2 size={8} className="animate-spin" /> : 'Unvouch'}
                              </button>
                            </>
                          ) : row.issues && row.issues.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onVouch(row);
                              }}
                              disabled={vouchingId === row.id}
                              className="font-medium text-ink-soft underline hover:text-ink-strong disabled:opacity-disabled"
                              title="Mark this issue as acceptable/resolved"
                            >
                              {vouchingId === row.id ? <Loader2 size={8} className="animate-spin" /> : 'Vouch'}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReview(row);
                            }}
                            className="press rounded-input border border-glass-hairline bg-surface px-2 py-0.5 font-semibold text-brand-dark hover:bg-brand/[0.06]"
                          >
                            Review
                          </button>
                        </span>
                      </Td>
                    )}
                  </Tr>
                );
              })
            )}
          </Tbody>

          {/* Sticky totals: an opaque surface, not a third blurred band. */}
          <tfoot className="sticky bottom-0 z-10 bg-surface/95 font-semibold text-ink-strong">
            <tr className="h-[24px]">
              {lead > 0 && (
                <Td colSpan={lead} className="border-t border-glass-hairline">
                  Total <span className="nums">{totals.count}</span>
                </Td>
              )}
              {v.amount && (
                <>
                  <Td className="nums-money border-t border-glass-hairline text-right">
                    {formatCurrency(totals.checksTotal)}
                  </Td>
                  <Td className="nums-money border-t border-glass-hairline text-right">
                    {formatCurrency(totals.qbTotal)}
                  </Td>
                  <Td className={`nums-money border-t border-glass-hairline text-right ${isOff(totals.difference) ? 'text-error-text' : 'text-ink-faint'}`}>
                    {formatCurrency(totals.difference)}
                  </Td>
                </>
              )}
              {trail > 0 && <Td colSpan={trail} className="border-t border-glass-hairline" />}
            </tr>
          </tfoot>
        </Table>
      </TableScroll>
      {footer}
    </TableShell>
  );
};
