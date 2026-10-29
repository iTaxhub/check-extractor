import { requireCapability, READ_METHODS } from '@/lib/match-helpers';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient, createServiceClient } from '@/lib/supabase/api';
import { patchJobCheck, withManualFields } from '@/lib/check-sync';

/**
 * Update Check Extraction Data
 * Allows manual correction of extracted check fields
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Server-side role gate (lib/roles.ts): the UI hiding the action is not enough.
  if (!READ_METHODS.has(req.method ?? '') && !(await requireCapability(req, res, 'checks.edit'))) return;
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { checkNumber, date, amount, payee, bankAccount, memo } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Check ID is required' });
  }

  try {
    const supabase = createAuthenticatedClient(req);

    // Build update object with only provided fields
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (checkNumber !== undefined) {
      updates.check_number = checkNumber;
      updates.check_number_source = 'manual';
    }
    if (date !== undefined) {
      updates.check_date = date;
      updates.check_date_source = 'manual';
    }
    if (amount !== undefined) {
      updates.amount = parseFloat(amount);
      updates.amount_source = 'manual';
    }
    if (payee !== undefined) {
      updates.payee = payee;
      updates.payee_source = 'manual';
    }
    if (bankAccount !== undefined) {
      updates.bank_name = bankAccount;
      updates.bank_name_source = 'manual';
    }
    if (memo !== undefined) {
      updates.memo = memo;
    }

    // Update the check record
    const { data, error } = await supabase
      .from('checks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update check:', error);
      return res.status(500).json({ error: 'Failed to update check', details: error.message });
    }

    // Same edit in checks_data, so the dashboard, QB comparisons and the extension agree.
    await patchJobCheck(createServiceClient(), data.tenant_id, data.job_id, data.check_id, (c) =>
      withManualFields(c, {
        checkNumber: checkNumber,
        checkDate: date,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        payee: payee,
        bankName: bankAccount,
        memo: memo,
      })
    ).catch(() => false);

    // Log the manual edit in audit trail (tenant_id is required by the audit_logs RLS policy)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const edited: [string, unknown][] = [
        ['check_number', checkNumber], ['check_date', date], ['amount', amount],
        ['payee', payee], ['bank_name', bankAccount], ['memo', memo],
      ];
      const auditLogs = edited
        .filter(([, v]) => v !== undefined)
        .map(([field, v]) => ({
          tenant_id: data.tenant_id,
          check_id: id,
          action: 'updated',
          field,
          new_value: v == null ? null : String(v),
          user_id: user?.id ?? null,
        }));
      if (auditLogs.length > 0) {
        await supabase.from('audit_logs').insert(auditLogs);
      }
    } catch (auditError) {
      console.error('Failed to create audit logs:', auditError);
      // Don't fail the request if audit logging fails
    }

    return res.status(200).json({
      success: true,
      check: data,
      message: 'Check updated successfully',
    });
  } catch (error: any) {
    console.error('Update check error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update check' });
  }
}
