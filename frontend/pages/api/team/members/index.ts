import type { NextApiRequest, NextApiResponse } from 'next';
import { requireCapability } from '@/lib/match-helpers';
import { can } from '@/lib/roles';
import { createServiceClient } from '@/lib/supabase/api';
import {
  invitationRowToMember,
  profileRowToMember,
  type TeamMemberDTO,
} from '@/lib/team-helpers';

/**
 * GET /api/team/members
 *
 * Response: { members: TeamMemberDTO[] }
 * Shape is dictated by app/(app)/settings/team/page.tsx, which was already
 * calling this endpoint before it existed.
 *
 * Administrator only (capability `team.view`). Reads go through the caller's
 * own RLS-bound client, so tenant isolation is enforced by the database as
 * well as by the explicit .eq('tenant_id', ...) below.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed', message: 'Method not allowed' });
  }

  // Everyone in the firm may SEE the team (read-only for Users); managing it
  // is `team.manage`, enforced on every write route. Invite links are bearer
  // secrets, so they are only returned to Administrators.
  const ctx = await requireCapability(req, res, 'checks.view');
  if (!ctx) return;

  try {
    // user_profiles reads use the service client with an explicit tenant filter.
    // Migration 010 restricts SELECT on user_profiles to `id = auth.uid()` to
    // avoid the RLS recursion it was written to fix, so an Administrator cannot
    // list their own teammates with their own client — it would return exactly
    // one row. Adding a tenant-read policy there would re-introduce that
    // recursion, so the authorisation is the capability gate above plus the
    // .eq('tenant_id', ctx.tenantId) on every query below.
    const service = createServiceClient();

    const [profilesRes, invitesRes] = await Promise.all([
      service
        .from('user_profiles')
        .select('id, email, full_name, role, created_at')
        .eq('tenant_id', ctx.tenantId)
        .order('created_at', { ascending: true }),
      ctx.supabase
        .from('team_invitations')
        .select('id, email, role, status, token, created_at, expires_at')
        .eq('tenant_id', ctx.tenantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (invitesRes.error) throw invitesRes.error;

    // Deactivation is an auth ban (see members/[id].ts), and last sign-in lives
    // on the auth user too. ponytail: one admin lookup per member; fine for
    // firm-sized teams, switch to a paged listUsers if teams grow to hundreds.
    const profiles = await Promise.all(
      (profilesRes.data || []).map(async (row: any) => {
        const { data } = await service.auth.admin.getUserById(row.id);
        const u: any = data?.user;
        const m = profileRowToMember({ ...row, last_sign_in_at: u?.last_sign_in_at });
        const banned = u?.banned_until && new Date(u.banned_until).getTime() > Date.now();
        return banned ? { ...m, status: 'deactivated' as const } : m;
      })
    );

    const members: TeamMemberDTO[] = [
      ...profiles,
      // Expired invitations are listed as 'expired' so they can be resent.
      ...(invitesRes.data || []).map(invitationRowToMember),
    ].map((m) => (can(ctx.role, 'team.manage') ? m : { ...m, invite_url: undefined }));

    return res.status(200).json({ members });
  } catch (err: any) {
    console.error('[team/members GET]', err);
    return res.status(500).json({ error: 'server_error', message: err?.message || 'Failed to load team' });
  }
}
