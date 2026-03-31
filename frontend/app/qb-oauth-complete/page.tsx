'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function QBOAuthCompleteContent() {
  const searchParams = useSearchParams();
  const company = searchParams?.get('company') || '';
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
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
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '48px 40px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        maxWidth: '420px',
        width: '100%',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
          QuickBooks Connected!
        </h1>
        {company && (
          <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 24px' }}>
            Connected to <strong style={{ color: '#111827' }}>{company}</strong>
          </p>
        )}
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 24px' }}>
          This tab will close in {countdown} second{countdown !== 1 ? 's' : ''}…
        </p>
        <p style={{ fontSize: '13px', color: '#6b7280', background: '#f9fafb', borderRadius: '8px', padding: '12px', margin: 0 }}>
          The Kyriq extension has been notified. You can return to the side panel.
        </p>
        <button
          onClick={() => window.close()}
          style={{
            marginTop: '20px',
            padding: '10px 24px',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Close Tab Now
        </button>
      </div>
    </div>
  );
}

export default function QBOAuthCompletePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Connected to QuickBooks! Closing tab…</p>
      </div>
    }>
      <QBOAuthCompleteContent />
    </Suspense>
  );
}
