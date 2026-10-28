'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { Button, ConfirmDialog, StatusPill } from '@/components/ui';
import { useSpelling } from '@/hooks/useSpelling';

interface Props {
  checkId: string;
  currentStatus: string;
}

export default function ApprovalActions({ checkId, currentStatus }: Props) {
  const t = useSpelling();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState<'approve' | 'reject' | null>(null);

  const act = async (action: 'approve' | 'reject') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/checks/${checkId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(`${action === 'approve' ? 'Approval' : 'Rejection'} failed${body?.error ? `: ${body.error}` : ''}`);
      }

      router.push(action === 'approve' ? '/export' : '/dashboard');
    } catch (e: any) {
      setError(e?.message || t(`Failed to ${action} cheque`));
    } finally {
      setLoading(false);
      setAsking(null);
    }
  };

  if (currentStatus === 'approved' || currentStatus === 'exported') {
    return <StatusPill status="approved" size="lg" icon={<Check size={14} />} label="Approved" />;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-3">
        <Button
          variant="destructive"
          size="sm"
          icon={<X size={18} />}
          disabled={loading}
          onClick={() => setAsking('reject')}
        >
          Reject
        </Button>
        <Button
          size="sm"
          icon={<Check size={18} />}
          loading={loading}
          onClick={() => setAsking('approve')}
        >
          Approve
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-error-text">{error}</p>
      )}
      <ConfirmDialog
        open={asking !== null}
        onCancel={() => setAsking(null)}
        onConfirm={() => { if (asking) void act(asking); }}
        loading={loading}
        tone={asking === 'reject' ? 'destructive' : 'success'}
        title={t(asking === 'reject' ? 'Reject this cheque?' : 'Approve this cheque?')}
        description={
          asking === 'reject'
            ? 'It stays in Kyriq, marked rejected, and is left out of exports.'
            : 'It is marked approved and becomes ready to export.'
        }
        confirmLabel={asking === 'reject' ? 'Reject' : 'Approve'}
      />
    </div>
  );
}
