'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button, GlassCard, GlassPanel } from '@/components/ui';

function QBOAuthCompleteContent() {
  const searchParams = useSearchParams();
  const company = searchParams?.get('company') || '';
  const error = searchParams?.get('error') || '';
  const detail = searchParams?.get('detail') || '';
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (error) return; // keep the tab open so the message can be read
    // Count down then close the tab
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [error]);

  if (error) {
    const message = error === 'company_owned_by_other_firm'
      ? `${detail || 'This QuickBooks company'} is already connected to another Kyriq firm, and that connection has been kept working. Ask that firm's admin to invite you under Users, then sign in to Kyriq with the invited email.`
      : `QuickBooks didn't connect (${error}${detail ? `: ${detail}` : ''}). Close this tab and try again from the side panel.`;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <GlassCard padding="none" reveal className="w-full max-w-[460px] px-10 py-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning-bg">
            <AlertTriangle className="h-9 w-9 text-warning-text" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-ink-strong mb-3">Not connected</h1>
          <p className="text-sm text-ink-body mb-6">{message}</p>
          <Button size="sm" onClick={() => window.close()}>Close Tab</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    // Transparent over the ambient mesh mounted in app/layout.tsx. This page
    // previously painted its own green gradient and used inline styles only,
    // which bypassed every token.
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <GlassCard padding="none" reveal className="w-full max-w-[420px] px-10 py-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-bg">
          <CheckCircle2 className="h-9 w-9 text-success-text" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-ink-strong mb-2">QuickBooks Connected!</h1>
        {company && (
          <p className="text-base text-ink-body mb-6">
            Connected to <strong className="text-ink-strong">{company}</strong>
          </p>
        )}
        <p className="text-sm text-ink-faint mb-6 nums" aria-live="polite">
          This tab will close in {countdown} second{countdown !== 1 ? 's' : ''}…
        </p>
        {/* GlassPanel, not another glass card — no blur nested inside blur. */}
        <GlassPanel tone="plain" radius="input" padding="sm" className="text-[13px] text-ink-body">
          The Kyriq extension has been notified. You can return to the side panel.
        </GlassPanel>
        <Button size="sm" className="mt-5" onClick={() => window.close()}>
          Close Tab Now
        </Button>
      </GlassCard>
    </div>
  );
}

export default function QBOAuthCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-ink-body">Connected to QuickBooks! Closing tab…</p>
      </div>
    }>
      <QBOAuthCompleteContent />
    </Suspense>
  );
}
