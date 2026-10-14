import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';

/**
 * POST /api/waitlist   — public, unauthenticated.
 *
 * Replaces the mailto: link behind "Join the waitlist", which threw the visitor
 * out of the site into whatever mail client the OS opened, and did nothing at
 * all on a machine with none configured.
 *
 * This is one of the very few routes on the app that anyone on the internet can
 * call without a session, so it is written for that:
 *
 *   - The service-role key lives HERE, server side, and never reaches the
 *     browser. Migration 040 revokes the table from anon/authenticated, so the
 *     client could not write it directly even if someone tried.
 *   - Input is validated and length-capped before it reaches the database.
 *     Everything is user-controlled and none of it is trusted.
 *   - Re-submitting the same address UPDATES that row instead of inserting a
 *     second one, so the list counts people. The unique index on lower(email)
 *     enforces it even if this code is bypassed.
 *   - The response is identical whether the address was new or already present.
 *     Saying "you are already on the list" would turn this into an oracle for
 *     testing whether a given person signed up.
 *   - A failed confirmation email does NOT fail the request. The signup is the
 *     thing worth keeping; the email is best-effort and its absence is visible
 *     in the admin table as a missing confirmed_at.
 */

const MAX = { email: 254, name: 120, company: 160, note: 1000 } as const;

// Deliberately permissive: this rejects obvious junk, not unusual-but-valid
// addresses. The real proof an address works is the confirmation email.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/**
 * Crude per-instance throttle. A serverless function may be one of several
 * instances, so this is a speed bump against a single noisy client, not a
 * guarantee. The unique index is what actually keeps the table clean.
 * ponytail: in-memory and per-instance; move to a shared store if abuse is real.
 */
const RECENT = new Map<string, number>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  for (const [k, t] of RECENT) if (now - t > WINDOW_MS) RECENT.delete(k);
  let hits = 0;
  for (const [k] of RECENT) if (k.startsWith(ip + '|')) hits++;
  if (hits >= MAX_PER_WINDOW) return true;
  RECENT.set(`${ip}|${now}`, now);
  return false;
}

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, max);
  return s.length ? s : null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  // Honeypot: a field hidden from people but filled in by naive bots. Answer 200
  // so the bot believes it succeeded and does not retry with a new shape.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const rawEmail = clean(body.email, MAX.email);
  if (!rawEmail || !EMAIL_RE.test(rawEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  const email = rawEmail.toLowerCase();
  const name = clean(body.name, MAX.name);
  const company = clean(body.company, MAX.company);
  const note = clean(body.note, MAX.note);

  // Throttled HERE, after validation, not at the top of the handler. Counting
  // rejected requests too would lock out someone who mistypes their address a
  // few times, and a 400 costs nothing anyway: it touches neither the database
  // nor the mail provider. Those are the expensive steps, so they are what the
  // limit protects.
  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[waitlist] Supabase env missing; cannot record signup');
    return res.status(503).json({ error: 'Signups are briefly unavailable. Please try again shortly.' });
  }
  const db = createClient(url, key);

  // onConflict names the unique index from 040 so a repeat submission updates
  // the existing row. Without it this would 23505 on the second attempt and the
  // visitor would be told something went wrong when nothing had.
  const { data, error } = await db
    .from('waitlist')
    .upsert(
      { email, name, company, note, source: clean(body.source, 60) || 'landing_kyriq_iq' },
      { onConflict: 'email', ignoreDuplicates: false }
    )
    .select('id, confirmed_at')
    .single();

  if (error) {
    console.error('[waitlist] upsert failed:', error.message);
    return res.status(500).json({ error: 'Could not save your details. Please try again.' });
  }

  // Only mail an address the first time. A second submission is almost always
  // someone unsure it worked; re-sending is noise, and the response below is
  // the same either way so it reveals nothing.
  if (!data?.confirmed_at) {
    try {
      const sent = await sendEmail({
        to: email,
        template: 'waitlist_confirmation',
        vars: { name },
        metadata: { source: 'waitlist', waitlistId: data?.id },
      });
      if (sent?.status === 'sent') {
        await db.from('waitlist').update({ confirmed_at: new Date().toISOString() }).eq('id', data.id);
      } else {
        console.error('[waitlist] confirmation not sent:', sent?.reason ?? 'unknown');
      }
    } catch (err: any) {
      // Never fail the signup over the email. The row is the valuable part.
      console.error('[waitlist] confirmation threw:', err?.message);
    }
  }

  return res.status(200).json({ ok: true });
}
