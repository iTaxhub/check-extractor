'use client';

import { useState } from 'react';
import { Building2, ChevronDown, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useQBConnections } from '@/hooks/useQBConnections';

interface QBCompanySwitcherProps {
  /** Extra className for the container */
  className?: string;
  /** Show just the current company name (compact mode) */
  compact?: boolean;
}

/**
 * Dropdown switcher that shows the active QB company and lets users switch
 * between connected companies. Designed to live in page headers.
 */
export function QBCompanySwitcher({ className = '', compact = false }: QBCompanySwitcherProps) {
  const { connections, active, isLoading, isSwitching, switchCompany } = useQBConnections();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg animate-pulse ${className}`}>
        <Building2 className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-400 w-24 h-3 bg-gray-300 rounded" />
      </div>
    );
  }

  if (!active) {
    return (
      <a
        href="/settings?tab=integrations"
        className={`flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        Connect QuickBooks
      </a>
    );
  }

  if (connections.length <= 1 || compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium ${className}`}>
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="max-w-[180px] truncate">{active.companyName}</span>
      </div>
    );
  }

  const handleSwitch = async (realmId: string) => {
    setOpen(false);
    if (realmId === active.realmId) return;
    try {
      await switchCompany(realmId);
    } catch {
      // error handled inside hook
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-indigo-400 hover:text-indigo-700 transition-colors shadow-sm disabled:opacity-60"
      >
        {isSwitching ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
        ) : (
          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
        )}
        <span className="max-w-[160px] truncate">{active.companyName}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Click-away overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[220px] py-1 overflow-hidden">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              QuickBooks Companies
            </p>
            {connections.map((conn) => (
              <button
                key={conn.realmId}
                onClick={() => handleSwitch(conn.realmId)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                  conn.isActive ? 'text-indigo-700 bg-indigo-50' : 'text-gray-700'
                }`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  conn.isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {(conn.companyName || '?').slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="font-medium truncate text-xs">{conn.companyName || `Realm ${conn.realmId}`}</div>
                  {conn.pendingCount > 0 && (
                    <div className="text-[10px] text-amber-600 font-medium">{conn.pendingCount} pending</div>
                  )}
                </div>
                {conn.isActive && (
                  <CheckCircle className="w-4 h-4 text-indigo-500 ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
