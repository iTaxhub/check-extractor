'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Dialog } from './dialog';

/**
 * ConfirmDialog — the one way to ask "are you sure?". Replaces window.confirm,
 * which renders as the browser's grey system box in the middle of a glass app.
 * Same shape as the extension's approve-confirm: an icon, a plain sentence, the
 * facts being committed as label/value rows, then Cancel + the action.
 *
 * Cancel is always the default focus; the action is never pre-selected.
 */
export interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Facts being committed, shown as label/value rows. */
  details?: [React.ReactNode, React.ReactNode][];
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'success' | 'destructive';
  loading?: boolean;
}

const TONE_ICON = {
  default: { Icon: HelpCircle, ring: 'bg-brand/10 text-brand-deep' },
  success: { Icon: CheckCircle2, ring: 'bg-success-bg text-success-text' },
  destructive: { Icon: AlertTriangle, ring: 'bg-error-bg text-error-text' },
} as const;

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  loading,
}: ConfirmDialogProps) {
  const { Icon, ring } = TONE_ICON[tone];
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      size="sm"
      hideClose
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'destructive' ? 'destructive' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <span className={cn('mb-3 flex h-12 w-12 items-center justify-center rounded-full', ring)} aria-hidden>
          <Icon className="h-6 w-6" />
        </span>
        <h2 className="font-heading text-[17px] font-semibold leading-[22px] tracking-[-0.012em] text-ink-strong">{title}</h2>
        {description ? <p className="mt-1.5 text-[13px] leading-[18px] text-ink-soft">{description}</p> : null}
      </div>
      {details?.length ? (
        <dl className="glass-panel mt-4 divide-y divide-glass-hairline overflow-hidden rounded-tile text-[13px]">
          {details.map(([label, value], i) => (
            <div key={i} className="flex items-baseline justify-between gap-4 px-3.5 py-2">
              <dt className="text-ink-soft">{label}</dt>
              <dd className="nums text-right font-medium text-ink-strong">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Dialog>
  );
}
