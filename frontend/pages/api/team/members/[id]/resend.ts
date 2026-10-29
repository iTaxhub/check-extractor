import type { NextApiRequest, NextApiResponse } from 'next';
import { requireCapability } from '@/lib/match-helpers';
import { createServiceClient } from '@/lib/supabase/api';
import { productRoleLabel } from '@/lib/roles';
import { auditLog, decodeMemberId, inviteUrl, isUuid, invitationRowToMember } from '@/lib/team-helpers';
import { sendOnce } from '@/lib/email/send';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * POST /api/team/members/invite_<id>/resend
 *
 * Re-sends a pending (or expired) invitation: keeps the same token, pushes the
 * expiry out another 7 days and emails it again. sendOnce is keyed on a fresh
 * periodKey so the resend is not swallowed as a duplicate of the first send,
 * while a double-click within the same millisecond still cannot send twice.
 *
 * Administrator only (capability `team.manage`). Tenant-scoped on every write.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed', message: 'Method not allowed' });
  }

  const ctx = await requireCapability(req, res, 'team.manage');
  if (!ctx) return;

  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const target = decodeMemberId(String(raw ?? ''));
  if (target.kind !== 'invitation' || !isUuid(target.id)) {
    return res.status(400).json({ error: 'invalid_id', message: 'Only invitations can be resent.' });
  }

  try {
    const { data: invitation, error } = await ctx.supabase
      .from('team_invitations')
      .update({ expires_at: new Date(Date.now() + SEVEN_DAYS_MS).toISOString(), status: 'pending' })
      .eq('id', target.id)
      .eq('tenant_id', ctx.tenantId)
      .select('id, email, role, status, token, created_at, expires_at')
      .maybeSingle();
    if (error) throw error;
    if (!invitation?.token) {
      return res.status(404).json({ error: 'not_found', message: 'Invitation not found.' });
    }

    const url = inviteUrl(invitation.token);
    const { data: tenant } = await createServiceClient()
      .from('tenants')
      .select('name')
      .eq('id', ctx.tenantId)
      .maybeSingle();

    const mail = await sendOnce({
      tenantId: ctx.tenantId,
      kind: 'team_invitation',
      periodKey: `${invitation.id}:resend:${Date.now()}`,
      to: invitation.email,
      template: 'team_invitation',
      vars: {
        firmName: tenant?.name ?? null,
        inviterName: ctx.email,
        roleLabel: productRoleLabel(invitation.role),
        inviteUrl: url,
        expiresAt: invitation.expires_at,
      },
    });

    await auditLog({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: 'team.invite_resent',
      entityType: 'team_invitation',
      entityId: invitation.id,
      metadata: { email: invitation.email, email_sent: mail.sent },
    });

    return res.status(200).json({
      member: invitationRowToMember(invitation),
      invite_url: url,
      email_sent: mail.sent,
      email_status: mail.status,
    });
  } catch (err: any) {
    console.error('[team/members resend]', err);
    return res.status(500).json({ error: 'server_error', message: err?.message || 'Failed to resend' });
  }
}
