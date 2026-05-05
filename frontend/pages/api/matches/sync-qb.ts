import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthContext, getActiveRealm, getValidToken } from '@/lib/match-helpers';
import { runMatching } from '@/lib/matching-algorithm';
import { createServiceClient } from '@/lib/supabase/api';

/**
 * POST /api/matches/sync-qb
 * Pull latest transactions from QB and re-run matching
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { supabase, userId, tenantId } = await getAuthContext(req);
    const realmId = await getActiveRealm(supabase, tenantId);
    if (!realmId) return res.status(400).json({ error: 'No active QB connection' });

    const db = createServiceClient();
    const accessToken = await getValidToken(tenantId, realmId);

    // Match the 90-day window used by the matching algorithm
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateStr = ninetyDaysAgo.toISOString().split('T')[0];

    const queries = [
      { query: `SELECT * FROM Purchase WHERE PaymentType = 'Check' AND TxnDate >= '${dateStr}'`, key: 'Purchase', type: 'Purchase' },
      { query: `SELECT * FROM BillPayment WHERE TxnDate >= '${dateStr}'`, key: 'BillPayment', type: 'BillPayment' },
      { query: `SELECT * FROM Check WHERE TxnDate >= '${dateStr}'`, key: 'Check', type: 'Check' },
    ];

    const allTxns: any[] = [];

    for (const q of queries) {
      try {
        const qbRes = await fetch(
          `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(q.query)}&minorversion=73`,
          { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
        );
        if (qbRes.ok) {
          const qbData = await qbRes.json();
          const txns = qbData?.QueryResponse?.[q.key] || [];
          txns.forEach((t: any) => {
            // ClearedStatus lives directly on the entity or under CheckPayment for Purchase
            const clearedStatus =
              t.ClearedStatus ||
              t.CheckPayment?.ClearedStatus ||
              t.TxnStatus ||
              null;

            allTxns.push({
              tenant_id: tenantId,
              user_id: userId,
              realm_id: realmId,
              txn_id: `${q.type.toLowerCase()}-${t.Id}`,
              txn_type: q.type,
              txn_date: t.TxnDate,
              payee: t.EntityRef?.name || t.VendorRef?.name || t.CustomerRef?.name || null,
              payee_id: t.EntityRef?.value || t.VendorRef?.value || null,
              amount: t.TotalAmt,
              memo: t.PrivateNote || null,
              doc_number: t.DocNumber || null,
              account: t.AccountRef?.name || t.BankAccountRef?.name || t.CheckPayment?.BankAccountRef?.name || null,
              cleared_status: clearedStatus,
            });
          });
          console.log(`✅ ${q.type}: ${txns.length} records`);
        }
      } catch (err: any) {
        console.warn(`⚠️ ${q.type} query failed:`, err.message);
      }
    }

    // 2. Upsert transactions into our DB (service client bypasses RLS)
    if (allTxns.length > 0) {
      const { error: upsertErr } = await db
        .from('qb_transactions')
        .upsert(allTxns, { onConflict: 'tenant_id,realm_id,txn_id' });
      if (upsertErr) console.warn('⚠️ qb_transactions upsert error:', upsertErr.message);
    }

    // 3. Re-run matching algorithm
    const result = await runMatching(tenantId, userId, realmId);

    // 4. Auto-approve matches whose QB transaction is already cleared/reconciled in QB
    const { data: clearedMatches } = await db
      .from('matches')
      .select('id, check_id, status, qb_txn_id, qb_txn:qb_transactions(cleared_status)')
      .eq('tenant_id', tenantId)
      .eq('realm_id', realmId)
      .in('status', ['matched', 'pending', 'discrepancy']);

    let autoApproved = 0;
    if (clearedMatches?.length) {
      const now = new Date().toISOString();
      const toAutoApprove = (clearedMatches as any[]).filter((m) => {
        const cs = m.qb_txn?.cleared_status;
        return cs === 'Cleared' || cs === 'Reconciled';
      });

      if (toAutoApprove.length) {
        const ids = toAutoApprove.map((m) => m.id);
        const checkIds = toAutoApprove.map((m) => m.check_id).filter(Boolean);

        await db
          .from('matches')
          .update({ status: 'approved', approved_by: userId, approved_at: now })
          .in('id', ids);

        if (checkIds.length) {
          await db
            .from('checks')
            .update({ status: 'approved' })
            .in('id', checkIds);
        }

        await db.from('match_audit_log').insert(
          ids.map((id: string) => ({
            match_id: id,
            user_id: userId,
            action: 'auto_approved_cleared',
            old_status: 'matched',
            new_status: 'approved',
            details: { source: 'qb_cleared_status' },
          }))
        );

        autoApproved = ids.length;
        console.log(`✅ Auto-approved ${autoApproved} matches from QB cleared status`);
      }
    }

    return res.status(200).json({ success: true, txnsSynced: allTxns.length, autoApproved, ...result });
  } catch (error: any) {
    console.error('QB sync error:', error);
    return res.status(500).json({ error: 'Sync failed', message: error.message });
  }
}
