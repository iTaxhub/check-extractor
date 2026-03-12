'use client';

import { useState, useEffect } from 'react';
import { Building2, RefreshCw, AlertCircle } from 'lucide-react';

interface CompanyInfo {
  realmId: string;
  companyName: string;
  connected: boolean;
}

interface QBCompanySelectorProps {
  onCompanyChange?: (realmId: string) => void;
}

export default function QBCompanySelector({ onCompanyChange }: QBCompanySelectorProps) {
  const [currentCompany, setCurrentCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentCompany();
  }, []);

  const fetchCurrentCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/qbo/company-info');
      
      if (response.ok) {
        const data = await response.json();
        setCurrentCompany({
          realmId: data.realmId,
          companyName: data.companyName,
          connected: data.connected,
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Not connected to QuickBooks');
        setCurrentCompany(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch company info');
      setCurrentCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchCompany = () => {
    // Redirect to settings to reconnect with different company
    window.location.href = '/settings?tab=integrations&action=reconnect';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <RefreshCw size={14} className="animate-spin text-gray-400" />
        <span className="text-xs text-gray-500">Loading company info...</span>
      </div>
    );
  }

  if (error || !currentCompany) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle size={14} className="text-red-500" />
        <span className="text-xs text-red-700">{error || 'Not connected'}</span>
        <button
          onClick={() => window.location.href = '/settings?tab=integrations'}
          className="ml-auto text-xs text-red-600 hover:text-red-800 font-medium"
        >
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
      <Building2 size={14} className="text-green-600" />
      <div className="flex-1">
        <div className="text-xs font-semibold text-green-900">{currentCompany.companyName}</div>
        <div className="text-[10px] text-green-600">QuickBooks Connected</div>
      </div>
      <button
        onClick={handleSwitchCompany}
        className="text-xs text-green-700 hover:text-green-900 font-medium"
        title="Switch to a different QuickBooks company"
      >
        Switch
      </button>
    </div>
  );
}
