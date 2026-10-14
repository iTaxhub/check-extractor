'use client';

/**
 * Kyriq IQ waitlist signup, on the page.
 *
 * Replaces a mailto: link, which handed the visitor to whatever mail client the
 * OS opened and did nothing at all where none was configured. It also meant the
 * only record of a signup was free text in one inbox.
 *
 * Inline rather than a modal on purpose: a dialog would need a focus trap,
 * escape handling, scroll locking and a return-focus target, and would put one
 * more click between wanting in and being in. The form is two fields.
 *
 * It posts to /api/waitlist, which owns validation and the database; nothing
 * here is trusted by the server.
 */
import { useRef, useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui';

type State = 'idle' | 'sending' | 'done' | 'error';

export function WaitlistForm() {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();

    // Mirror of the server rule, only so the common typo is caught without a
    // round trip. /api/waitlist re-validates; this is convenience, not a gate.
    if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) {
      setState('error');
      setError('Enter a valid email address.');
      emailRef.current?.focus();
      return;
    }

    setState('sending');
    setError(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: form.get('name') || null,
          website: form.get('website') || null, // honeypot
          source: 'landing_kyriq_iq',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      setState('done');
    } catch (err: any) {
      setState('error');
      setError(err?.message || 'Something went wrong. Please try again.');
    }
  }

  if (state === 'done') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-card border border-glass-hairline-dark bg-white/[0.06] px-4 py-3.5 max-w-[440px]"
      >
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accentEmerald/20">
          <Check className="h-3 w-3 text-accentEmerald" aria-hidden />
        </span>
        <p className="text-[14px] leading-relaxed text-shell-text">
          You&apos;re on the list.
          {/* Deliberately does not promise a confirmation email has arrived.
              The send is best-effort by design (a failed email must not fail the
              signup), so claiming it was sent would be a statement the system
              cannot stand behind. What IS guaranteed is the row. */}
          <span className="block text-shell-muted">
            We&apos;ll email this address the moment Kyriq IQ opens up.
          </span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-[440px]">
      {/* Honeypot: hidden from people, tempting to naive bots. Not display:none,
          which some bots skip; off-screen and untabbable instead. */}
      <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="wl-website">Website</label>
        <input id="wl-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex-1">
          <label htmlFor="wl-email" className="sr-only">Work email</label>
          <input
            id="wl-email"
            ref={emailRef}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@firm.com"
            disabled={state === 'sending'}
            aria-invalid={state === 'error' || undefined}
            aria-describedby={error ? 'wl-error' : undefined}
            className={cn(
              'w-full rounded-input border px-3.5 py-2.5 text-[15px]',
              'bg-white/[0.06] text-shell-text placeholder:text-shell-muted/70',
              'border-glass-hairline-dark outline-none transition',
              'focus:border-accentEmerald/60 focus:ring-2 focus:ring-accentEmerald/25',
              'disabled:opacity-60'
            )}
          />
        </div>
        <button
          type="submit"
          disabled={state === 'sending'}
          className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'shrink-0')}
        >
          {state === 'sending' ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden /> Joining
            </>
          ) : (
            <>
              Join the waitlist <ArrowRight size={16} aria-hidden />
            </>
          )}
        </button>
      </div>

      <label htmlFor="wl-name" className="sr-only">Your name (optional)</label>
      <input
        id="wl-name"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Your name (optional)"
        disabled={state === 'sending'}
        className={cn(
          'mt-2.5 w-full rounded-input border px-3.5 py-2.5 text-[15px]',
          'bg-white/[0.06] text-shell-text placeholder:text-shell-muted/70',
          'border-glass-hairline-dark outline-none transition',
          'focus:border-accentEmerald/60 focus:ring-2 focus:ring-accentEmerald/25',
          'disabled:opacity-60'
        )}
      />

      {/* aria-live so a screen reader hears the failure without moving focus. */}
      <p id="wl-error" role="alert" aria-live="polite" className="mt-2 min-h-[18px] text-[13px] text-red-300">
        {error}
      </p>
    </form>
  );
}
