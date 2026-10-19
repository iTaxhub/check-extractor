'use client';

import { Check, Loader2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BatchStep, BatchStepNumber } from '@/lib/batch-state';

/**
 * The four steps: Upload → Match → Review → Approve.
 *
 * Michael, on the record: "I think the 1,2,3,4 description on the reconcile
 * page helps the individual know each step. Plus, they can click on each one
 * too." So every step is a real control — but a forward step that is not
 * `unlocked` is disabled and says WHY, instead of being a dead link. In the
 * v17 prototype these were plain anchors and Approve was reachable from Upload.
 *
 * This component renders `steps` exactly as the server derived them. It holds
 * no step state of its own and it does not decide what is reachable: it reports
 * the click, and `onSelect` POSTs to /api/batches/[id]/advance.
 */

export interface StepperProps {
  steps: BatchStep[];
  /** The step on screen. Comes from the server, never from a click. */
  activeStep: BatchStepNumber;
  /** A step whose advance call is in flight. */
  pendingStep?: BatchStepNumber | null;
  /** Set from a 409: the step that was refused and the reason given. */
  lockedStep?: BatchStepNumber | null;
  lockedReason?: string | null;
  onSelect: (step: BatchStepNumber) => void;
}

export default function Stepper({
  steps,
  activeStep,
  pendingStep = null,
  lockedStep = null,
  lockedReason = null,
  onSelect,
}: StepperProps) {
  return (
    <nav aria-label="Reconciliation stages">
      <ol className="flex flex-wrap items-stretch gap-y-2 border-b border-glass-hairline pb-3">
        {steps.map((s, i) => {
          const isActive = s.step === activeStep;
          const isPending = s.step === pendingStep;
          // Locked == the server will refuse it. It stays a button so it can
          // be focused and explain itself, but it cannot be activated.
          const locked = !s.unlocked && !s.complete;
          const refused = lockedStep === s.step && !!lockedReason;
          const status = s.complete ? 'Done' : isActive ? 'Current' : locked ? 'Locked' : 'Available';

          return (
            <li key={s.key} className="flex min-w-0 flex-1 basis-40 items-start">
              <button
                type="button"
                onClick={() => onSelect(s.step)}
                disabled={locked || isPending}
                aria-current={isActive ? 'step' : undefined}
                aria-disabled={locked || undefined}
                title={locked ? s.reason || undefined : undefined}
                className={cn(
                  'flex w-full min-w-0 items-start gap-2 rounded-md px-2 py-1.5 text-left',
                  'transition-[background-color,color] duration-tap ease-settle',
                  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  locked ? 'cursor-not-allowed' : 'hover:bg-brand/[0.045]'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill',
                    'text-xs font-semibold nums',
                    s.complete
                      ? 'bg-success-bg text-success-text'
                      : isActive
                        ? 'bg-brand-dark text-white'
                        : 'bg-ink-strong/[0.07] text-ink-faint'
                  )}
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : s.complete ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    s.step
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isActive ? 'text-ink-strong' : locked ? 'text-ink-faint' : 'text-ink-body'
                      )}
                    >
                      {s.label}
                    </span>
                    {locked ? <Lock className="h-3 w-3 shrink-0 text-ink-faint" aria-hidden /> : null}
                  </span>
                  <span
                    className={cn(
                      'block text-xs',
                      isActive ? 'font-medium text-brand-dark' : s.complete ? 'text-success-text' : 'text-ink-faint'
                    )}
                  >
                    {status}
                  </span>
                  {locked && s.reason ? (
                    <span className="sr-only">{s.reason}</span>
                  ) : null}
                  {refused ? (
                    <span role="status" className="mt-1 block text-xs font-medium text-warning-text">
                      {lockedReason}
                    </span>
                  ) : null}
                </span>
              </button>
              {i < steps.length - 1 ? (
                <span aria-hidden className="mx-1 mt-4 hidden h-px w-6 shrink-0 bg-glass-hairline sm:block" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
