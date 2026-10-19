'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';

/**
 * Issue a new set of MFA recovery codes on purpose.
 *
 * Codes are no longer re-issued on every sign-in (that silently voided the
 * saved set), so this is the one place to replace them: after a set was
 * exposed, used up, or lost. The endpoint replaces all unused codes; the
 * confirm step says so before anything changes.
 */
export default function RecoveryCodesCard() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await createClient().auth.getSession();
      const res = await fetch('/api/auth/mfa/recovery-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(body?.codes) || body.codes.length === 0) {
        throw new Error(body?.message || 'Could not issue new recovery codes.');
      }
      setCodes(body.codes);
      setConfirming(false);
    } catch (err: any) {
      setError(err?.message || 'Could not issue new recovery codes.');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!codes) return;
    const text = [
      'Kyriq two-factor recovery codes',
      `Issued: ${new Date().toLocaleString('en-GB')}`,
      '',
      'Each code works ONCE at kyriq.com/mfa if you lose your authenticator app.',
      '',
      ...codes,
      '',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyriq-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (codes) {
    return (
      <div className="space-y-3 rounded-tile border border-glass-hairline p-4">
        <p className="text-sm font-semibold text-ink-strong">New recovery codes</p>
        <p className="text-xs text-ink-body">
          Your previous unused codes no longer work. Save these now; they are not shown again.
        </p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-sm text-ink-strong">
          {codes.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={download}>Download .txt</Button>
          <Button size="sm" variant="ghost" onClick={() => setCodes(null)}>I have saved them</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {confirming ? (
        <div className="space-y-2 rounded-tile border border-warning-border bg-warning-bg p-3">
          <p className="text-sm text-warning-text">
            This replaces every unused recovery code you have. The old ones stop working immediately.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={busy} onClick={generate}>Generate new codes</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" icon={<KeyRound size={16} />} onClick={() => setConfirming(true)}>
          Generate new recovery codes
        </Button>
      )}
      {error ? <p className="text-xs text-error-text">{error}</p> : null}
    </div>
  );
}
