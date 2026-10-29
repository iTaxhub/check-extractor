import type { NextApiRequest, NextApiResponse } from 'next';
import { service } from '@/lib/billing/service';
import { getRequestUser } from '@/lib/supabase/api';
import { outcome, sendDueNotices } from './notices';

/**
 * POST /api/email/welcome (Bearer). Sends the firm's welcome and trial-started
 * emails now instead of waiting for the daily notices cron (08:10 UTC), which
 * left new sign-ups without a welcome for up to a day. Called once by the app
 * shell after the first sign-in; sendOnce keys make repeats a no-op.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const svc = service();
  const { data: profile } = await svc.from('user_profiles').select('tenant_id').eq('id', user.id).maybeSingle();
  if (!profile?.tenant_id) return res.status(200).json({ sent: 0 });
  const { data: tenant } = await svc.from('tenants').select('id, name').eq('id', profile.tenant_id).maybeSingle();
  const { data: state, error } = await svc.rpc('tenant_usage_state', { p_tenant_id: profile.tenant_id });
  if (!tenant || error || !state) return res.status(200).json({ sent: 0 });

  const o = outcome();
  await sendDueNotices(o, tenant, state as Record<string, any>, ['welcome', 'trial_started']);
  return res.status(200).json(o);
}
