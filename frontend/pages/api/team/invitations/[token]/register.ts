import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/api';

/**
 * POST /api/team/invitations/[token]/register  { password, fullName? }
 *
 * Creates the invitee's account straight from a valid invitation: the email is
 * the invited one (never taken from the body) and is marked confirmed, because
 * holding the invitation link already proves the address. The page then signs
 * in with that password and calls ./accept, which moves the new user from the
 * empty firm signup creates into the inviting firm.
 *
 *   201 { ok: true, email }
 *   409 { error: 'account_exists' }  sign in instead
 *   404 / 410                         invitation missing / expired or used
 *   400 { error: 'weak_password' }
 */
const PASSWORD_MIN = 8;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
  if (!token || !/^[0-9a-f]{32,128}$/i.test(token)) {
    return res.status(404).json({ error: 'not_found', message: 'This invitation link is not valid.' });
  }
  const password = String(req.body?.password || '');
  if (password.length < PASSWORD_MIN) {
    return res.status(400).json({ error: 'weak_password', message: `Use at least ${PASSWORD_MIN} characters.` });
  }

  const service = createServiceClient();
  const { data: invitation } = await service
    .from('team_invitations')
    .select('id, email, status, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (!invitation) return res.status(404).json({ error: 'not_found', message: 'This invitation link is not valid.' });
  if (invitation.status === 'accepted') {
    return res.status(410).json({ error: 'already_accepted', message: 'This invitation has already been used.' });
  }
  if (invitation.status === 'expired' || invitation.status === 'revoked' || invitation.status === 'cancelled' ||
      (invitation.expires_at && new Date(invitation.expires_at).getTime() <= Date.now())) {
    return res.status(410).json({ error: 'expired', message: 'This invitation has expired. Ask your Administrator to send a new one.' });
  }

  const email = String(invitation.email).toLowerCase();
  const fullName = String(req.body?.fullName || '').trim().slice(0, 120);
  const { error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : {},
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      return res.status(409).json({ error: 'account_exists', message: 'You already have a Kyriq account. Sign in to join.' });
    }
    console.error('[team/invitations register]', error.message);
    return res.status(500).json({ error: 'server_error', message: 'Could not create your account. Try again.' });
  }
  return res.status(201).json({ ok: true, email });
}
