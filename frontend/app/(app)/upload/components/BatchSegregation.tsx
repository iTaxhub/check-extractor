'use client';

/**
 * Sorts an analysed batch into what the files actually are.
 *
 * Thirty files used to arrive as one flat list of "12 pages, 47 cheques found"
 * rows. You could not tell a bank statement from a sheet of cheque images, and
 * the two that found NO cheques — the only ones needing a person — looked
 * exactly like the twenty-eight that were fine.
 *
 * Nothing extra is computed to do this: detection has already run, so each file
 * knows its page count and what landed on each page. See lib/document-kind.ts.
 *
 * Every row says WHY it was sorted where it was, because the classification is
 * a guess from page shape and the cost of a silent wrong answer is extraction
 * pointed at the wrong kind of document.
 */
import { AlertCircle, FileSpreadsheet, FileText, Files, ScanLine } from 'lucide-react';
import { GlassCard, GlassCardTitle, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  groupByKind,
  KIND_LABEL,
  type DocumentKind,
  type DocumentSignals,
} from '@/lib/document-kind';

export interface BatchFile {
  id: string;
  name: string;
  signals: DocumentSignals | null;
}

const ICON: Record<DocumentKind, typeof FileText> = {
  'no-cheques': AlertCircle,
  'bank-statement': FileSpreadsheet,
  'cheque-sheet': Files,
  'single-cheque': ScanLine,
};

/** Attention first, and it is the only group that reads as a problem. */
const TONE: Record<DocumentKind, { chip: string; icon: string }> = {
  'no-cheques': { chip: 'bg-warning/15 text-warning', icon: 'text-warning' },
  'bank-statement': { chip: 'bg-brand/10 text-brand', icon: 'text-brand' },
  'cheque-sheet': { chip: 'bg-accentEmerald/15 text-accentEmerald', icon: 'text-accentEmerald' },
  'single-cheque': { chip: 'bg-ink-faint/15 text-ink-soft', icon: 'text-ink-soft' },
};

export default function BatchSegregation({ files }: { files: BatchFile[] }) {
  const groups = groupByKind(files, (f) => f.signals);
  const sorted = groups.reduce((n, g) => n + g.items.length, 0);

  // One file sorts into one group, which tells the reader nothing they cannot
  // already see on the row itself.
  if (sorted < 2) return null;

  const pending = files.length - sorted;
  const attention = groups.find((g) => g.kind === 'no-cheques')?.items.length ?? 0;

  return (
    <GlassCard>
      <div className="mb-3 flex items-center justify-between gap-3">
        <GlassCardTitle className="text-sm">
          Sorted {sorted} file{sorted === 1 ? '' : 's'}
        </GlassCardTitle>
        {attention > 0 && (
          <Badge tone="warning" size="sm">
            {attention} need{attention === 1 ? 's' : ''} a look
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {groups.map(({ kind, items }) => {
          const Icon = ICON[kind];
          const tone = TONE[kind];
          return (
            <div key={kind}>
              <div className="mb-1.5 flex items-center gap-2">
                <Icon size={14} className={tone.icon} aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {KIND_LABEL[kind]}
                </span>
                <span className={cn('rounded-pill px-1.5 py-0.5 text-[11px] font-semibold nums', tone.chip)}>
                  {items.length}
                </span>
              </div>

              <ul className="space-y-1">
                {items.map(({ item, verdict }) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-4 rounded-input px-2 py-1.5 text-xs hover:bg-surface-raised"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium text-ink-strong">
                      {item.name}
                    </span>
                    {/* The reason, not a score: it says what was seen, so a
                        wrong call is obvious rather than authoritative. */}
                    <span className="shrink-0 text-right text-ink-faint">
                      {verdict.reason}
                      {verdict.confidence === 'low' && (
                        <span className="ml-1.5 font-semibold text-warning">unsure</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {pending > 0 && (
        <p className="mt-3 border-t border-glass-hairline pt-2 text-xs text-ink-faint">
          {pending} more still being read.
        </p>
      )}
    </GlassCard>
  );
}
