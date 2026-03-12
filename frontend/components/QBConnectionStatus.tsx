'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';

interface QBStatus {
  connected: boolean;
  configured: boolean;
  credentialsExist: boolean;
  companyName: string | null;
  realmId: string | null;
  tokenExpiry: string | null;
  lastSync: string | null;
  error: string | null;
}

export default function QBConnectionStatus() {
  const [status, setStatus] = useState<QBStatus>({
    connected: false,
    configured: false,
    credentialsExist: false,
    companyName: null,
    realmId: null,
    tokenExpiry: null,
    lastSync: null,
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      // Check integration status
      const integrationRes = await fetch('/api/settings/integrations');
      
      if (integrationRes.ok) {
        const data = await integrationRes.json();
        
        // Check company info if connected
        let companyInfo = null;
        if (data.qboConnected) {
          try {
            const companyRes = await fetch('/api/qbo/company-info');
            if (companyRes.ok) {
              companyInfo = await companyRes.json();
            }
          } catch (err) {
            console.warn('Could not fetch company info:', err);
          }
        }

        setStatus({
          connected: data.qboConnected || false,
          configured: data.qbConfigured || false,
          credentialsExist: data.credentialsExist || false,
          companyName: companyInfo?.companyName || data.companyName || null,
          realmId: data.realmId || null,
          tokenExpiry: null, // TODO: Add token expiry tracking
          lastSync: null, // TODO: Add last sync tracking
          error: null,
        });
      } else {
        const errorData = await integrationRes.json();
        setStatus(prev => ({
          ...prev,
          error: errorData.error || 'Failed to check status',
        }));
      }
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        error: error.message || 'Network error',
      }));
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="animate-spin text-gray-400" />
          <span className="text-sm text-gray-600">Checking QuickBooks connection...</span>
        </div>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 text-sm">Connection Check Failed</h3>
            <p className="text-red-700 text-xs mt-1">{status.error}</p>
          </div>
          <button
            onClick={checkStatus}
            disabled={checking}
            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${
      status.connected ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.connected ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <XCircle className="text-amber-600" size={20} />
            )}
            <div>
              <h3 className={`font-semibold text-sm ${
                status.connected ? 'text-green-900' : 'text-amber-900'
              }`}>
                {status.connected ? 'Connected to QuickBooks' : 'Not Connected'}
              </h3>
              {status.companyName && (
                <p className="text-xs text-gray-700 mt-0.5">
                  Company: <span className="font-semibold">{status.companyName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={checkStatus}
            disabled={checking}
            className="p-2 hover:bg-white/50 rounded transition disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Status Details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {status.configured ? (
              <CheckCircle size={12} className="text-green-600" />
            ) : (
              <XCircle size={12} className="text-red-600" />
            )}
            <span className={status.configured ? 'text-green-800' : 'text-red-800'}>
              Credentials {status.configured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {status.connected ? (
              <CheckCircle size={12} className="text-green-600" />
            ) : (
              <XCircle size={12} className="text-amber-600" />
            )}
            <span className={status.connected ? 'text-green-800' : 'text-amber-800'}>
              OAuth {status.connected ? 'Active' : 'Required'}
            </span>
          </div>

          {status.realmId && (
            <div className="col-span-2 flex items-center gap-1.5 text-gray-600">
              <span className="font-medium">Realm ID:</span>
              <span className="font-mono text-[10px]">{status.realmId}</span>
            </div>
          )}
        </div>

        {/* Token Status (if connected) */}
        {status.connected && (
          <div className="pt-2 border-t border-green-200">
            <div className="flex items-center gap-1.5 text-xs text-green-800">
              <Clock size={12} />
              <span>Token auto-refresh: Active</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
