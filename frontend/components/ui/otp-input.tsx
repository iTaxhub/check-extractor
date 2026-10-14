'use client';

/**
 * One box per digit, the way Stripe and the banks do it.
 *
 * Replaces a single <input maxLength={7}> that gave no indication of how many
 * digits were wanted and made the user find the button afterwards.
 *
 * The things that make a segmented input feel right are mostly the ones people
 * only notice when they are missing, so they are all here and all deliberate:
 *
 *   PASTE. Nobody types a code they copied. Pasting into any box fills the
 *   whole row, and a paste of "123 456" or "123-456" works because everything
 *   that is not a digit is stripped first.
 *
 *   ONE SOURCE OF TRUTH. The boxes render from the `value` string the parent
 *   owns; they do not each hold their own state. Six states that must agree is
 *   how these components end up out of sync with the form that submits them.
 *
 *   BACKSPACE ON AN EMPTY BOX moves to the previous box AND clears it. Moving
 *   without clearing means a second backspace is needed to delete, which reads
 *   as a dropped keypress.
 *
 *   AUTOFILL. autoComplete="one-time-code" sits on the first box only, which is
 *   what iOS and Android look for; put it on all six and the OS fills the same
 *   digit into every one.
 *
 *   REAL INPUTS, not a hidden field with painted divs. Password managers,
 *   screen readers and mobile keyboards all work with inputs and none of them
 *   work reliably with the painted version.
 */
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface OtpInputProps {
  value: string;
  onChange: (next: string) => void;
  /** Fired once the last box is filled. The parent decides whether to submit. */
  onComplete?: (code: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  /** Labels the group for screen readers, e.g. "6-digit code". */
  label: string;
  id?: string;
  className?: string;
}

export interface OtpInputHandle {
  focusFirst: () => void;
}

const DIGITS = /\D/g;

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  { value, onChange, onComplete, length = 6, disabled, invalid, autoFocus, label, id = 'otp', className },
  ref
) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    focusFirst: () => boxes.current[0]?.focus(),
  }));

  const focus = (i: number) => {
    const el = boxes.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  /** Single place where a new value is published, so onComplete cannot be missed. */
  const publish = (next: string, caret: number) => {
    const clean = next.replace(DIGITS, '').slice(0, length);
    onChange(clean);
    focus(caret);
    if (clean.length === length) onComplete?.(clean);
  };

  const handleChange = (i: number, raw: string) => {
    const typed = raw.replace(DIGITS, '');
    if (!typed) return;

    // Several characters at once: an autofill, or a paste that arrived as input
    // rather than a paste event. Overwrite from this box onwards.
    if (typed.length > 1) {
      const merged = (value.slice(0, i) + typed).slice(0, length);
      publish(merged, merged.length);
      return;
    }

    // One character. A code has no gaps, so typing into a box past the end
    // appends rather than leaving a hole behind it — otherwise clicking the
    // last empty box and typing would produce a value the boxes do not show.
    if (i < value.length) {
      const chars = value.split('');
      chars[i] = typed;                       // overtype a filled box
      publish(chars.join(''), i + 1);
    } else {
      publish(value + typed, value.length + 1);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const chars = value.split('');
      if (chars[i]) {
        // Clear this box, stay put.
        chars[i] = '';
        onChange(chars.join('').replace(/\s/g, ''));
      } else if (i > 0) {
        // Empty box: step back AND clear, so one press deletes one digit.
        chars[i - 1] = '';
        onChange(chars.join('').replace(/\s/g, ''));
        focus(i - 1);
      }
      return;
    }
    if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1); }
    if (e.key === 'Delete') {
      e.preventDefault();
      const chars = value.split('');
      chars[i] = '';
      onChange(chars.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(DIGITS, '');
    if (!text) return;
    e.preventDefault(); // or the browser also drops the first character into this box
    publish(text.slice(0, length), Math.min(text.length, length - 1));
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex items-center gap-2 sm:gap-2.5', className)}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { boxes.current[i] = el; }}
          id={i === 0 ? id : `${id}-${i}`}
          // Each box is announced with its position, otherwise a screen reader
          // hears six identically-named fields.
          aria-label={`${label}, digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          // type=text, not number: number shows spinners, allows "e" and "-",
          // and silently refuses a leading zero in some browsers.
          type="text"
          // Only the first box, or the OS fills every box with the same digit.
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          className={cn(
            'h-13 w-11 sm:h-14 sm:w-12 rounded-input border text-center',
            'font-mono text-xl font-semibold tabular-nums text-ink-strong',
            'bg-white/70 transition-[box-shadow,border-color,background-color] duration-quick ease-settle',
            'focus:outline-none focus:border-brand focus:bg-white/90 focus:ring-[3px] focus:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-60',
            invalid ? 'border-error text-error-text focus:border-error focus:ring-error/40' : 'border-glass-hairline'
          )}
        />
      ))}
    </div>
  );
});
