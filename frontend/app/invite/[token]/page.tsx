'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { productRoleLabel } from '@/lib/roles';
import {
  Button,
  GlassCard,
  GlassCardBody,
  GlassCardTitle,
  GlassPanel,
  Badge,
  Skeleton,
} from '@/components/ui';

type State =
  | 'loading'
  | 'valid'
  | 'accepted'
  | 'expired'
  | 'not_found'
  | 'wrong_email'
  | 'already_member'
  | 'signin_required'
  | 'joined'
  | 'error';

interface Invitation {
  email: string;
  role: string;
  firm: string;
  expires_at?: string;
}

/**
 * /invite/[token] — the invitation accept page. Handles, in order:
 * not found, already accepted, expired, not signed in, signed in as the wrong
 * person, and already a member of another firm.
 */
export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [state, setState] = useState<State>('loading');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  // Signed-out invitee: the invited email is fixed; they only choose a password.
  const [mode, setMode] = useState<'create' | 'signin' | 'reset'>('create');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setState('not_found');
      return;
    }
    try {
      const [res, session] = await Promise.all([
        fetch(`/api/team/invitations/${encodeURIComponent(token)}`),
        createClient().auth.getSession(),
      ]);
      const data = await res.json().catch(() => ({}));
      const email = session.data.session?.user?.email ?? null;
      setSignedInAs(email);

      if (!res.ok && res.status !== 404) {
        setState('error');
        setMessage(data?.message || 'Could not read this invitation.');
        return;
      }

      if (data?.state === 'valid') {
        setInvitation({ email: data.email, role: data.role, firm: data.firm, expires_at: data.expires_at });
        if (!email) {
          setState('signin_required');
        } else if (email.toLowerCase() !== String(data.email).toLowerCase()) {
          setState('wrong_email');
        } else {
          setState('valid');
        }
        return;
      }

      if (data?.state === 'accepted' || data?.state === 'expired') {
        setInvitation({ email: data.email, role: data.role, firm: data.firm, expires_at: data.expires_at });
        setState(data.state);
        return;
      }

      setState('not_found');
    } catch (err: any) {
      setState('error');
      setMessage(err?.message || 'Could not read this invitation.');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async () => {
    setBusy(true);
    setMessage('');
    try {
      const { data } = await createClient().auth.getSession();
      const res = await fetch(`/api/team/invitations/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(data.session?.access_token
            ? { Authorization: `Bearer ${data.session.access_token}` }
            : {}),
        },
      });
      const body = await res.json().catch(() => ({}));

      if (res.ok && body?.ok === true) {
        setState('joined');
        setTimeout(() => router.push('/mfa?next=/dashboard'), 1200);
        return;
      }

      setMessage(body?.message || 'Could not accept this invitation.');
      switch (body?.error) {
        case 'unauthenticated':
          setState('signin_required');
          break;
        case 'wrong_email':
          setState('wrong_email');
          break;
        case 'already_accepted':
          setState('accepted');
          break;
        case 'expired':
          setState('expired');
          break;
        case 'already_member':
          setState('already_member');
          break;
        case 'not_found':
          setState('not_found');
          break;
        default:
          setState('error');
      }
    } catch (err: any) {
      setState('error');
      setMessage(err?.message || 'Could not accept this invitation.');
    } finally {
      setBusy(false);
    }
  };

  // Create the account from the invitation (or sign in to an existing one),
  // then join the firm in the same click.
  const joinWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'create' || mode === 'reset') {
        const r = await fetch(`/api/team/invitations/${encodeURIComponent(token)}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, fullName, resetPassword: mode === 'reset' }),
        });
        const body = await r.json().catch(() => ({}));
        if (r.status === 409) {
          setMode('signin');
          setPassword('');
          setMessage('This email already has a Kyriq account. Enter its password, or set a new one below.');
          return;
        }
        if (!r.ok) throw new Error(body?.message || 'Could not create your account.');
      }
      const { error } = await createClient().auth.signInWithPassword({ email: invitation.email, password });
      if (error) throw new Error(mode === 'signin' ? 'That password is not right. Try again, or use "Set a new one" below.' : error.message);
      await accept();
    } catch (err: any) {
      setMessage(err?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const signOutAndRetry = async () => {
    await createClient().auth.signOut();
    window.location.href = `/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`;
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2.5">
          <Image src="/brand/kyriq-logo.svg" alt="Kyriq" width={97} height={40} priority />
        </div>

        <GlassCard padding="lg" reveal className="space-y-5">
          {state === 'loading' && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          )}

          {state === 'valid' && invitation && (
            <>
              <GlassCardTitle>Join {invitation.firm}</GlassCardTitle>
              <GlassCardBody>
                You have been invited to {invitation.firm} on Kyriq as{' '}
                <strong>{productRoleLabel(invitation.role)}</strong>.
              </GlassCardBody>
              <GlassPanel className="rounded-xl p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-faint">Invited email</span>
                  <span className="font-medium">{invitation.email}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-ink-faint">Role</span>
                  <Badge tone="brand">{productRoleLabel(invitation.role)}</Badge>
                </div>
                {invitation.expires_at && (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-ink-faint">Expires</span>
                    <span>{new Date(invitation.expires_at).toLocaleDateString()}</span>
                  </div>
                )}
              </GlassPanel>
              {message && <p className="text-sm text-error-text">{message}</p>}
              <Button block onClick={accept} disabled={busy}>
                {busy ? 'Joining…' : 'Accept invitation'}
              </Button>
            </>
          )}

          {state === 'signin_required' && invitation && (
            <form onSubmit={joinWithPassword} className="space-y-4">
              <GlassCardTitle>Join {invitation.firm}</GlassCardTitle>
              <GlassCardBody>
                {mode === 'create'
                  ? <>You have been invited as <strong>{productRoleLabel(invitation.role)}</strong>. Set a password to finish. You will set up two-step verification next.</>
                  : mode === 'reset'
                    ? <>Choose a new password for your Kyriq account. This invitation was sent to your email, so no reset email is needed.</>
                    : <>Sign in with your Kyriq password to join {invitation.firm}.</>}
              </GlassCardBody>
              <label className="block space-y-1.5 text-sm">
                <span className="text-ink-faint">Email</span>
                <input value={invitation.email} readOnly aria-readonly className="w-full rounded-input border border-glass-hairline bg-surface/60 px-3 py-2 text-ink-body" />
              </label>
              {mode === 'create' && (
                <label className="block space-y-1.5 text-sm">
                  <span className="text-ink-faint">Your name</span>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className="w-full rounded-input border border-glass-hairline bg-surface px-3 py-2" />
                </label>
              )}
              <label className="block space-y-1.5 text-sm">
                <span className="text-ink-faint">{mode === 'signin' ? 'Password' : mode === 'reset' ? 'New password (8+ characters)' : 'Choose a password (8+ characters)'}</span>
                <input type="password" required minLength={mode === 'signin' ? 1 : 8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} autoFocus className="w-full rounded-input border border-glass-hairline bg-surface px-3 py-2" />
              </label>
              {message && <p className="text-sm text-error-text">{message}</p>}
              <Button block type="submit" disabled={busy}>
                {busy ? 'Joining…' : `Join ${invitation.firm}`}
              </Button>
              <div className="flex flex-col items-center gap-1.5 text-sm">
                {mode === 'signin' && (
                  <button type="button" className="text-brand-deep underline-offset-2 hover:underline" onClick={() => { setMode('reset'); setPassword(''); setMessage(''); }}>
                    Forgot your password? Set a new one
                  </button>
                )}
                {mode !== 'signin' && (
                  <button type="button" className="text-brand-deep underline-offset-2 hover:underline" onClick={() => { setMode('signin'); setMessage(''); }}>
                    I know my Kyriq password
                  </button>
                )}
              </div>
            </form>
          )}

          {state === 'wrong_email' && invitation && (
            <>
              <GlassCardTitle>Wrong account</GlassCardTitle>
              <GlassCardBody>
                This invitation was sent to <strong>{invitation.email}</strong>
                {signedInAs ? <> but you are signed in as <strong>{signedInAs}</strong></> : null}.
              </GlassCardBody>
              <Button block variant="secondary" onClick={signOutAndRetry}>
                Sign in as {invitation.email}
              </Button>
            </>
          )}

          {state === 'accepted' && (
            <>
              <GlassCardTitle>Already accepted</GlassCardTitle>
              <GlassCardBody>
                This invitation has already been used. If that was you, just sign in.
              </GlassCardBody>
              <Button block variant="secondary" onClick={() => router.push('/login')}>
                Go to sign in
              </Button>
            </>
          )}

          {state === 'expired' && (
            <>
              <GlassCardTitle>Invitation expired</GlassCardTitle>
              <GlassCardBody>
                Invitations are valid for 7 days. Ask an Administrator at{' '}
                {invitation?.firm || 'your firm'} to send a new one.
              </GlassCardBody>
            </>
          )}

          {state === 'already_member' && (
            <>
              <GlassCardTitle>Account already belongs to a firm</GlassCardTitle>
              <GlassCardBody>{message}</GlassCardBody>
              <Button block variant="secondary" onClick={signOutAndRetry}>
                Use a different account
              </Button>
            </>
          )}

          {state === 'not_found' && (
            <>
              <GlassCardTitle>Invitation not found</GlassCardTitle>
              <GlassCardBody>
                This link is not valid. It may have been cancelled or already replaced by a newer
                invitation.
              </GlassCardBody>
            </>
          )}

          {state === 'joined' && invitation && (
            <>
              <GlassCardTitle>You are in</GlassCardTitle>
              <GlassCardBody>
                Welcome to {invitation.firm}. Next, secure your account with two-step verification…
              </GlassCardBody>
            </>
          )}

          {state === 'error' && (
            <>
              <GlassCardTitle>Something went wrong</GlassCardTitle>
              <GlassCardBody>{message || 'Please try again.'}</GlassCardBody>
              <Button block variant="secondary" onClick={() => { setState('loading'); load(); }}>
                Try again
              </Button>
            </>
          )}
        </GlassCard>
      </div>
    </main>
  );
}
