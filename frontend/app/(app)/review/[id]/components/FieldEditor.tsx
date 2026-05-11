'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from '@/types/check';
import ConfidenceBadge from './ConfidenceBadge';
import { createClient } from '@/lib/supabase/client';

interface Props {
  check: Check;
}

export default function FieldEditor({ check }: Props) {
  const router = useRouter();
  const [fields, setFields] = useState({
    payee: check.payee || '',
    amount: check.amount?.toString() || '',
    check_date: check.check_date || '',
    check_number: check.check_number || '',
    bank_name: check.bank_name || '',
  });
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Track originals so we can compute the diff to push to QB.
  const original = {
    payee: check.payee || '',
    amount: check.amount?.toString() || '',
    check_date: check.check_date || '',
    check_number: check.check_number || '',
    bank_name: check.bank_name || '',
  };

  const handleFieldChange = (field: string, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  /**
   * After saving locally, look up the linked QB transaction (matches.qb_txn_id)
   * and push only the fields that actually changed to QuickBooks.
   * Returns a human-readable status string for the inline banner.
   */
  const pushChangesToQB = async (changed: Record<string, any>): Promise<{ ok: boolean; message: string }> => {
    try {
      const supabase = createClient();
      const { data: match } = await supabase
        .from('matches')
        .select('qb_txn_id')
        .eq('check_id', check.id)
        .maybeSingle();
      if (!match?.qb_txn_id) {
        return { ok: false, message: 'No linked QuickBooks transaction — saved locally only.' };
      }

      // Map check fields to update-transaction.ts payload
      const apiFields: Record<string, any> = {};
      if (changed.amount != null)        apiFields.amount    = changed.amount;
      if (changed.check_date)            apiFields.txnDate   = changed.check_date;
      if (changed.check_number != null)  apiFields.docNumber = String(changed.check_number);
      if (Object.keys(apiFields).length === 0) {
        return { ok: true, message: 'No QB-relevant fields changed.' };
      }

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/qbo/update-transaction', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ qbTxnId: match.qb_txn_id, fields: apiFields }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, message: data?.error || `QB sync failed (${res.status})` };
      }
      return { ok: true, message: `QuickBooks updated: ${Object.keys(apiFields).join(', ')}` };
    } catch (e: any) {
      return { ok: false, message: e?.message || 'QB sync failed (network error)' };
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const supabase = createClient();

      // Compute changed fields vs originals
      const parsedAmount = parseFloat(fields.amount);
      const changed: Record<string, any> = {};
      if (fields.payee !== original.payee)               changed.payee = fields.payee;
      if (fields.amount !== original.amount && !isNaN(parsedAmount)) changed.amount = parsedAmount;
      if (fields.check_date !== original.check_date)     changed.check_date = fields.check_date;
      if (fields.check_number !== original.check_number) changed.check_number = fields.check_number;
      if (fields.bank_name !== original.bank_name)       changed.bank_name = fields.bank_name;

      const { error } = await supabase
        .from('checks')
        .update({
          payee: fields.payee,
          amount: isNaN(parsedAmount) ? null : parsedAmount,
          check_date: fields.check_date,
          check_number: fields.check_number,
          bank_name: fields.bank_name,
          // Mark as manual edits
          payee_source: 'manual',
          amount_source: 'manual',
          check_date_source: 'manual',
          check_number_source: 'manual',
        })
        .eq('id', check.id);

      if (error) throw error;

      // Create audit log
      await fetch(`/api/checks/${check.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      // Push the diff to QuickBooks (non-blocking — we still show local save success on QB failure)
      if (Object.keys(changed).length > 0) {
        const qb = await pushChangesToQB(changed);
        if (qb.ok) {
          setStatusMessage({ type: 'success', text: `Saved ✓ — ${qb.message}` });
        } else {
          setStatusMessage({ type: 'warning', text: `Saved locally ✓ — ⚠ ${qb.message}` });
        }
      } else {
        setStatusMessage({ type: 'success', text: 'Saved ✓ — no changes detected.' });
      }
      router.refresh();
    } catch (error: any) {
      console.error('Save error:', error);
      setStatusMessage({ type: 'error', text: error?.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold">Extracted Fields</h3>
        <p className="text-sm text-gray-600 mt-1">Review and edit as needed</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Payee */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Payee
            </label>
            <ConfidenceBadge 
              confidence={check.payee_confidence || 0}
              source={check.payee_source || 'ocr'}
            />
          </div>
          <input
            type="text"
            value={fields.payee}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('payee', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <ConfidenceBadge 
              confidence={check.amount_confidence || 0}
              source={check.amount_source || 'ocr'}
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              value={fields.amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('amount', e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <ConfidenceBadge 
              confidence={check.check_date_confidence || 0}
              source={check.check_date_source || 'ocr'}
            />
          </div>
          <input
            type="date"
            value={fields.check_date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('check_date', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Check Number */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Check Number
            </label>
            <ConfidenceBadge 
              confidence={check.check_number_confidence || 0}
              source={check.check_number_source || 'ocr'}
            />
          </div>
          <input
            type="text"
            value={fields.check_number}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('check_number', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Bank Name */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Bank Name
            </label>
            <ConfidenceBadge 
              confidence={check.bank_name_confidence || 0}
              source={check.bank_name_source || 'ocr'}
            />
          </div>
          <input
            type="text"
            value={fields.bank_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('bank_name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Inline status banner */}
        {statusMessage && (
          <div className={`text-sm rounded-lg px-3 py-2 border ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
            statusMessage.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                              'bg-red-50 text-red-800 border-red-200'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {saving ? 'Saving...' : 'Save Changes (& push to QB if linked)'}
        </button>
      </div>
    </div>
  );
}