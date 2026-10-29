'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Mail, RotateCw, Trash2, UserCheck, UserPlus, UserX, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  GlassCard,
  GlassCardTitle,
  GlassPanel,
  IconButton,
  Input,
  Select,
  Skeleton,
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { useSpelling } from '@/hooks/useSpelling';
import { adminOnly, usePermissions } from '@/hooks/usePermissions';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'expired' | 'deactivated';
  invited_at: string;
  last_active?: string;
  expires_at?: string;
  invite_url?: string;
}

type Role = TeamMember['role'];

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'admin', label: 'Administrator', description: 'Everything, including team, billing and settings' },
  { value: 'member', label: 'User', description: 'Upload, review, approve and export' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only' },
];
const ROLE_LABEL: Record<Role, string> = { admin: 'Administrator', member: 'User', viewer: 'Viewer' };

const LAST_ADMIN = 'A firm must keep at least one Administrator.';
const SELF = 'You cannot change your own access.';

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : '');

function StatusBadge({ member }: { member: TeamMember }) {
  switch (member.status) {
    case 'active':
      return <Badge tone="success" size="sm">Active</Badge>;
    case 'deactivated':
      return <Badge tone="neutral" size="sm">Deactivated</Badge>;
    case 'expired':
      return <Badge tone="error" size="sm">Expired{member.expires_at ? ` · ${fmtDate(member.expires_at)}` : ''}</Badge>;
    default:
      return (
        <Badge tone="warning" size="sm">
          Invited{member.expires_at ? ` · expires ${fmtDate(member.expires_at)}` : ''}
        </Badge>
      );
  }
}

type Confirm =
  | { kind: 'remove' | 'deactivate' | 'revoke'; member: TeamMember }
  | null;

/** Reads a JSON error body into a sentence, whatever the route returned. */
async function failure(res: Response, fallback: string) {
  const body = await res.json().catch(() => null);
  return body?.message || fallback;
}

export default function TeamPage() {
  const t = useSpelling();
  const perms = usePermissions();
  const canManage = perms.can('team.manage');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/team/members');
      if (!response.ok) throw new Error(await failure(response, 'Could not load the team.'));
      const data = await response.json();
      setTeamMembers(data.members || []);
      setLoadError(null);
    } catch (error: any) {
      setLoadError(error?.message || 'Could not load the team.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  /**
   * Optimistic write: apply `patch` locally, call the API, roll back to the
   * snapshot on failure. `patch === null` removes the row.
   */
  const mutate = async (
    member: TeamMember,
    patch: Partial<TeamMember> | null,
    request: () => Promise<Response>,
    success: string
  ) => {
    const snapshot = teamMembers;
    setTeamMembers((list) =>
      patch === null ? list.filter((m) => m.id !== member.id) : list.map((m) => (m.id === member.id ? { ...m, ...patch } : m))
    );
    setBusy(member.id);
    try {
      const res = await request();
      if (!res.ok) throw new Error(await failure(res, 'That did not work.'));
      const body = await res.json().catch(() => null);
      if (body?.member) {
        setTeamMembers((list) => list.map((m) => (m.id === member.id ? { ...m, ...body.member } : m)));
      }
      toast.success(success);
      return body;
    } catch (err: any) {
      setTeamMembers(snapshot);
      toast.error(err?.message || 'That did not work.');
      return null;
    } finally {
      setBusy(null);
    }
  };

  const json = (method: string, body?: unknown) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const memberUrl = (id: string) => `/api/team/members/${encodeURIComponent(id)}`;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    try {
      const response = await fetch('/api/team/invite', json('POST', { email: inviteEmail, role: inviteRole }));
      if (!response.ok) throw new Error(await failure(response, 'Failed to send invitation'));
      const body = await response.json();
      setInviteEmail('');
      setInviteRole('member');
      fetchTeamMembers();
      toast.success(body?.email_sent === false ? 'Invitation created. Copy the link to share it.' : 'Invitation sent');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const changeRole = (member: TeamMember, role: Role) =>
    mutate(member, { role }, () => fetch(memberUrl(member.id), json('PATCH', { role })), `Role changed to ${ROLE_LABEL[role]}`);

  const setActive = (member: TeamMember, active: boolean) =>
    mutate(
      member,
      { status: active ? 'active' : 'deactivated' },
      () => fetch(memberUrl(member.id), json('PATCH', { active })),
      active ? `${member.email} reactivated` : `${member.email} deactivated`
    );

  const remove = (member: TeamMember) =>
    mutate(
      member,
      null,
      () => fetch(memberUrl(member.id), { method: 'DELETE' }),
      member.status === 'active' || member.status === 'deactivated' ? 'Team member removed' : 'Invitation revoked'
    );

  const resend = (member: TeamMember) =>
    mutate(member, { status: 'pending' }, () => fetch(`${memberUrl(member.id)}/resend`, json('POST')), `Invitation resent to ${member.email}`);

  const copyLink = async (member: TeamMember) => {
    if (!member.invite_url) return toast.error('No invite link available.');
    try {
      await navigator.clipboard.writeText(member.invite_url);
      toast.success('Invite link copied');
    } catch {
      toast.error('Could not copy. Your browser blocked clipboard access.');
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, member } = confirm;
    setConfirm(null);
    if (kind === 'deactivate') await setActive(member, false);
    else await remove(member);
  };

  const members = teamMembers.filter((m) => m.status === 'active' || m.status === 'deactivated');
  const invitations = teamMembers.filter((m) => m.status === 'pending' || m.status === 'expired');
  const activeAdmins = members.filter((m) => m.role === 'admin' && m.status === 'active').length;

  /** Why this member's access cannot be changed right now, or null if it can. */
  const lockReason = (m: TeamMember): string | null => {
    if (!canManage) return adminOnly('manage the team');
    if (m.id === perms.userId) return SELF;
    if (m.role === 'admin' && m.status === 'active' && activeAdmins <= 1) return LAST_ADMIN;
    return null;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-5" data-tone="brand">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-body transition-colors duration-quick ease-settle hover:text-ink-strong"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Settings
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-semibold text-ink-strong">Users</h1>
        {!perms.loading && !canManage && (
          <p className="mt-1 text-sm text-ink-body">{adminOnly('invite people or change access')}</p>
        )}
      </div>

      {/* ── Invite (Administrators only) ── */}
      {canManage && (
        <GlassCard padding="lg" className="space-y-4">
          <GlassCardTitle>Invite Team Member</GlassCardTitle>

          <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Email" htmlFor="inviteEmail" required className="flex-1">
              <Input
                id="inviteEmail"
                type="email"
                autoComplete="off"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@theirfirm.com"
                required
              />
            </Field>
            <Field label="Role" htmlFor="inviteRole" className="sm:w-48">
              <Select
                id="inviteRole"
                value={inviteRole}
                options={ROLE_OPTIONS}
                onValueChange={(v) => setInviteRole(v as Role)}
              />
            </Field>
            <Button type="submit" loading={inviting} icon={<UserPlus size={16} />}>
              {inviting ? 'Inviting…' : 'Invite'}
            </Button>
          </form>

          <GlassPanel tone="sunken" radius="input" padding="sm">
            <p className="mb-1.5 text-xs font-semibold text-ink-strong">Role permissions</p>
            <ul className="space-y-1 text-xs text-ink-body">
              <li>
                <strong className="text-ink-strong">Administrator:</strong> full access including team
                management, billing, reports and settings
              </li>
              <li>
                <strong className="text-ink-strong">User:</strong> {t('can upload, review and export cheques')}
              </li>
              <li>
                <strong className="text-ink-strong">Viewer:</strong>{' '}
                {t('can only view cheques and analytics (read-only)')}
              </li>
            </ul>
          </GlassPanel>
        </GlassCard>
      )}

      {/* ── Members ── */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="border-b border-glass-hairline px-5 py-3.5">
          <GlassCardTitle className="text-base">
            Team Members <span className="nums text-ink-faint">({members.length})</span>
          </GlassCardTitle>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : loadError ? (
          <p className="px-5 py-10 text-center text-sm text-error-text" role="alert">{loadError}</p>
        ) : members.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-faint">
            No team members yet. Invite someone to get started.
          </p>
        ) : (
          <ul>
            {members.map((member) => {
              const lock = lockReason(member);
              const deactivated = member.status === 'deactivated';
              return (
                <li
                  key={member.id}
                  className="glass-divider flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors duration-quick ease-settle hover:bg-brand/[0.045]"
                >
                  <div className={`flex min-w-0 flex-1 items-center gap-3 ${deactivated ? 'opacity-60' : ''}`}>
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-semibold text-white"
                      aria-hidden
                    >
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink-strong">
                          {member.name || member.email}
                          {member.id === perms.userId && <span className="ml-1 text-ink-faint">(you)</span>}
                        </p>
                        <StatusBadge member={member} />
                      </div>
                      <p className="truncate text-xs text-ink-body">{member.email}</p>
                      {member.last_active && (
                        <p className="nums mt-0.5 text-xs text-ink-faint">Last active: {fmtDate(member.last_active)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canManage ? (
                      <span title={lock ?? undefined}>
                        <Select
                          inputSize="sm"
                          aria-label={`Role for ${member.email}`}
                          value={member.role}
                          options={ROLE_OPTIONS}
                          disabled={!!lock || busy === member.id}
                          onValueChange={(v) => v !== member.role && changeRole(member, v as Role)}
                          className="w-40"
                        />
                      </span>
                    ) : (
                      <Badge tone={member.role === 'admin' ? 'brand' : 'outline'} size="sm">
                        {ROLE_LABEL[member.role]}
                      </Badge>
                    )}

                    {canManage && (
                      <>
                        <IconButton
                          aria-label={deactivated ? `Reactivate ${member.email}` : `Deactivate ${member.email}`}
                          title={lock ?? (deactivated ? 'Reactivate' : 'Deactivate')}
                          size="icon-sm"
                          disabled={!!lock || busy === member.id}
                          onClick={() => (deactivated ? setActive(member, true) : setConfirm({ kind: 'deactivate', member }))}
                          className="text-ink-faint hover:text-ink-strong"
                        >
                          {deactivated ? <UserCheck size={16} /> : <UserX size={16} />}
                        </IconButton>
                        <IconButton
                          aria-label={`Remove ${member.email}`}
                          title={lock ?? 'Remove member'}
                          size="icon-sm"
                          disabled={!!lock || busy === member.id}
                          onClick={() => setConfirm({ kind: 'remove', member })}
                          className="text-ink-faint hover:text-error-text"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

      {/* ── Invitations ── */}
      {invitations.length > 0 && (
        <GlassCard padding="none" className="overflow-hidden">
          <div className="border-b border-glass-hairline px-5 py-3.5">
            <GlassCardTitle className="text-base">
              Invitations <span className="nums text-ink-faint">({invitations.length})</span>
            </GlassCardTitle>
          </div>
          <ul>
            {invitations.map((member) => (
              <li
                key={member.id}
                className="glass-divider flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-bg"
                    aria-hidden
                  >
                    <Mail className="h-4 w-4 text-warning-text" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink-strong">{member.email}</p>
                      <StatusBadge member={member} />
                    </div>
                    <p className="nums text-xs text-ink-body">Invited {fmtDate(member.invited_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {canManage ? (
                    <>
                      <Select
                        inputSize="sm"
                        aria-label={`Role for invitation to ${member.email}`}
                        value={member.role}
                        options={ROLE_OPTIONS}
                        disabled={busy === member.id}
                        onValueChange={(v) => v !== member.role && changeRole(member, v as Role)}
                        className="w-40"
                      />
                      <IconButton
                        aria-label={`Resend invitation to ${member.email}`}
                        title="Resend invite"
                        size="icon-sm"
                        disabled={busy === member.id}
                        onClick={() => resend(member)}
                        className="text-ink-faint hover:text-ink-strong"
                      >
                        <RotateCw size={16} />
                      </IconButton>
                      <IconButton
                        aria-label={`Copy invite link for ${member.email}`}
                        title={member.status === 'expired' ? 'Expired: resend to renew the link' : 'Copy invite link'}
                        size="icon-sm"
                        disabled={!member.invite_url || member.status === 'expired'}
                        onClick={() => copyLink(member)}
                        className="text-ink-faint hover:text-ink-strong"
                      >
                        <Copy size={16} />
                      </IconButton>
                      <IconButton
                        aria-label={`Revoke invitation to ${member.email}`}
                        title="Revoke invite"
                        size="icon-sm"
                        disabled={busy === member.id}
                        onClick={() => setConfirm({ kind: 'revoke', member })}
                        className="text-ink-faint hover:text-error-text"
                      >
                        <XCircle size={16} />
                      </IconButton>
                    </>
                  ) : (
                    <Badge tone="outline" size="sm">{ROLE_LABEL[member.role]}</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
        tone="destructive"
        title={
          confirm?.kind === 'revoke'
            ? 'Revoke this invitation?'
            : confirm?.kind === 'deactivate'
              ? 'Deactivate this member?'
              : 'Remove team member?'
        }
        description={
          confirm?.kind === 'revoke'
            ? 'The invite link stops working immediately. You can invite them again later.'
            : confirm?.kind === 'deactivate'
              ? 'They can no longer sign in. Their history stays, and you can reactivate them at any time.'
              : 'They lose access to this firm immediately and their login is deleted. This cannot be undone.'
        }
        details={confirm ? [['Email', confirm.member.email], ['Role', ROLE_LABEL[confirm.member.role]]] : undefined}
        confirmLabel={confirm?.kind === 'revoke' ? 'Revoke' : confirm?.kind === 'deactivate' ? 'Deactivate' : 'Remove'}
      />
    </div>
  );
}
