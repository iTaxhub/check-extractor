'use client';

import { X, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, GlassCard, IconButton } from '@/components/ui';
import { cn } from '@/lib/utils';

export type QueueState = 'ready' | 'working' | 'done' | 'error';

export interface QueueRow {
  state: QueueState;
  /** The real stage text or error reason for this file. */
  detail?: string;
}

interface Props {
  files: File[];
  onRemove: (index: number) => void;
  /** Re-runs analysis for one failed file. Offered on error rows only. */
  onRetry?: (file: File) => void;
  /** Per-file state, same order as `files`. Missing means ready. */
  rows?: (QueueRow | undefined)[];
  /** Remove is disabled while files are being sent. */
  locked?: boolean;
}

const STATE_LABEL: Record<QueueState, string> = {
  ready: 'Ready',
  working: 'Analyzing',
  done: 'Analyzed',
  error: 'Failed',
};

/** The one list of selected files: name, size, state, remove. */
export default function MultiFileQueue({ files, onRemove, onRetry, rows, locked = false }: Props) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <GlassCard padding="none" className="overflow-hidden">
      <ul aria-label="Selected files">
        {files.map((file, index) => {
          const row = rows?.[index] ?? { state: 'ready' as const };
          return (
            <li
              key={`${file.name}-${index}`}
              className="glass-divider flex items-center gap-3 px-4 py-2.5"
            >
              <FileText className="shrink-0 text-ink-faint" size={16} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-strong">{file.name}</p>
                <p
                  className={cn(
                    'truncate text-xs',
                    row.state === 'error' ? 'text-error-text' : 'text-ink-faint'
                  )}
                >
                  <span className="nums">{formatFileSize(file.size)}</span>
                  {row.detail ? <> · {row.detail}</> : null}
                </p>
              </div>
              <span
                className={cn(
                  'flex shrink-0 items-center gap-1 text-xs font-medium',
                  row.state === 'done' && 'text-success-text',
                  row.state === 'error' && 'text-error-text',
                  row.state === 'working' && 'text-brand-dark',
                  row.state === 'ready' && 'text-ink-soft'
                )}
              >
                {row.state === 'working' ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden />
                ) : row.state === 'done' ? (
                  <CheckCircle size={12} aria-hidden />
                ) : row.state === 'error' ? (
                  <AlertCircle size={12} aria-hidden />
                ) : null}
                {STATE_LABEL[row.state]}
              </span>
              {row.state === 'error' && onRetry && (
                <Button size="sm" variant="ghost" onClick={() => onRetry(file)} disabled={locked}>
                  Retry
                </Button>
              )}
              <IconButton
                aria-label={`Remove ${file.name}`}
                size="icon-sm"
                onClick={() => onRemove(index)}
                disabled={locked}
                className="text-ink-faint hover:text-error-text"
              >
                <X size={14} />
              </IconButton>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
