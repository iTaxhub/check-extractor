'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { IconButton } from './button';

/**
 * Dialog and Sheet.
 *
 * In and out are asymmetric: a dialog arrives like an object (460ms spring
 * from scale(0.86)) and dismisses instantly (180ms). Entrances are CSS
 * keyframes, never a framer-motion tween — rAF is frozen in a hidden
 * document, so a JS tween from `opacity: 0` can leave content permanently
 * invisible if the tab was backgrounded at mount.
 *
 * Sheets translate from 110%, not 100%, so the shadow clears the viewport too.
 *
 * Only ONE blurred surface in the stack: the overlay is a plain tinted scrim,
 * the panel carries the blur.
 *
 * BOTH ARE PORTALLED TO <body>, and that is load-bearing rather than tidiness.
 * `backdrop-filter` makes an element the containing block for every
 * position:fixed descendant — so does transform, filter, perspective and
 * contain. This design puts backdrop-filter on the app chrome, so an overlay
 * rendered from a component that happens to live inside the top bar stops
 * resolving `fixed` against the viewport and resolves it against a ~60px-tall
 * header instead. That is not hypothetical: the Disconnect confirmation is
 * rendered by CompanySwitcher, which sits inside ShellTopBar (.glass-chrome),
 * so its `bottom-0` meant "the bottom of the header" and the sheet grew upward
 * off the top of the screen — a destructive action whose confirmation could not
 * be read or reached. Portalling to <body> escapes any such ancestor, whichever
 * surface a future caller renders from.
 */

/**
 * True once mounted on the client. The portal target does not exist during the
 * server render, and `createPortal` against a missing node throws, so the first
 * client render matches the server's (nothing) and the portal appears after.
 */
function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

export const dialogPanelVariants = cva(
  // max-h + flex-col is the other half of "a dialog you can always reach".
  // The container centres with items-center, so a panel taller than the
  // viewport overflows EQUALLY above and below — and the half above the top
  // edge is unrecoverable, because useDismiss locks body scroll. Bounding the
  // panel and scrolling the body region instead keeps the header on screen
  // however long the content is.
  'relative flex max-h-[90vh] w-full flex-col glass-modal rounded-modal text-ink-strong animate-dialog-pop',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        full: 'max-w-5xl',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export const sheetPanelVariants = cva(
  'fixed glass-modal text-ink-strong shadow-glass-sheet',
  {
    variants: {
      side: {
        bottom: 'inset-x-0 bottom-0 rounded-t-modal animate-sheet-up',
        right: 'inset-y-0 right-0 h-full w-full max-w-md rounded-l-modal animate-glass-rise',
        left: 'inset-y-0 left-0 h-full w-full max-w-md rounded-r-modal animate-glass-rise',
      },
    },
    defaultVariants: { side: 'bottom' },
  }
);

/** Escape-to-close + body scroll lock, shared by Dialog and Sheet. */
function useDismiss(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

interface OverlayBaseProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name. Rendered as the header title when `header` is unset. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Hide the corner close button (for flows that must be resolved). */
  hideClose?: boolean;
}

export interface DialogProps extends OverlayBaseProps, VariantProps<typeof dialogPanelVariants> {}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  hideClose,
  size,
}: DialogProps) {
  useDismiss(open, onClose);
  const mounted = useMounted();
  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      {/* Plain scrim. No blur here — the panel already blurs. */}
      <div
        className="absolute inset-0 bg-ink-strong/45 animate-glass-fade"
        onClick={onClose}
        aria-hidden
      />
      <div className={cn(dialogPanelVariants({ size }), className)}>
        {(title || !hideClose) && (
          <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-4">
            <div className="min-w-0">
              {title ? (
                <h2 className="font-heading text-lg font-semibold text-ink-strong">{title}</h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm text-ink-body">{description}</p>
              ) : null}
            </div>
            {!hideClose && (
              <IconButton aria-label="Close" size="icon-sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        )}
        {/* min-h-0 so this region, not the panel, is what shrinks and scrolls:
            a flex child's default min-height is its content, which would push
            the panel past max-h and reintroduce the overflow. */}
        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">{children}</div>
        ) : null}
        {footer ? (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-glass-hairline px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

export interface SheetProps extends OverlayBaseProps, VariantProps<typeof sheetPanelVariants> {}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  hideClose,
  side,
}: SheetProps) {
  useDismiss(open, onClose);
  const mounted = useMounted();
  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div
        className="absolute inset-0 bg-ink-strong/45 animate-glass-fade"
        onClick={onClose}
        aria-hidden
      />
      <div className={cn(sheetPanelVariants({ side }), className)}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-heading text-lg font-semibold text-ink-strong">{title}</h2>
            ) : null}
            {description ? <p className="mt-1 text-sm text-ink-body">{description}</p> : null}
          </div>
          {!hideClose && (
            <IconButton aria-label="Close" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          )}
        </div>
        {children ? <div className="scroll-region max-h-[70vh] px-6 pb-5">{children}</div> : null}
        {footer ? (
          <div className="border-t border-glass-hairline px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
