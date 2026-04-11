import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';

const QBO_BASE = 'https://quickbooks.api.intuit.com';
const QBO_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com';

async function getTokens(supabase: any) {
  try {
    const { data: activeConn } = await supabase
      .from('qb_connections')
      .select('access_token, refresh_token, realm_id, token_expires_at')
      .eq('is_active', true)
      .order('connected_at', { ascending: false })
      .limit(1)
      .single();

    if (activeConn?.access_token && activeConn?.realm_id) {
      const { data: creds } = await supabase
        .from('integrations')
        .select('qb_client_id, qb_client_secret')
        .eq('provider', 'quickbooks')
        .maybeSingle();
      return {
        access_token: activeConn.access_token,
        refresh_token: activeConn.refresh_token,
        realm_id: activeConn.realm_id,
        expires_at: activeConn.token_expires_at,
        qb_client_id: creds?.qb_client_id,
        qb_client_secret: creds?.qb_client_secret,
      };
    }
  } catch (_) {}

  const { data } = await supabase
    .from('integrations')
    .select('access_token, refresh_token, realm_id, expires_at, qb_client_id, qb_client_secret')
    .eq('provider', 'quickbooks')
    .single();
  if (!data?.access_token || !data?.realm_id) return null;
  return data;
}

async function refreshToken(supabase: any, tokens: any): Promise<string | null> {
  const clientId = tokens.qb_client_id || process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = tokens.qb_client_secret || process.env.QUICKBOOKS_CLIENT_SECRET;
  if (!clientId || !clientSecret || !tokens.refresh_token) return null;
  try {
    const res = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token }),
    });
    if (!res.ok) return null;
    const t = await res.json();
    const newExpires = new Date(Date.now() + t.expires_in * 1000).toISOString();
    await supabase.from('qb_connections').update({ access_token: t.access_token, refresh_token: t.refresh_token, token_expires_at: newExpires }).eq('realm_id', tokens.realm_id);
    await supabase.from('integrations').update({ access_token: t.access_token, refresh_token: t.refresh_token, expires_at: newExpires }).eq('provider', 'quickbooks');
    return t.access_token;
  } catch {
    return null;
  }
}

/**
 * POST /api/qbo/create-check
 * Creates a Purchase (check written) or Deposit (received check) in QuickBooks.
 * Body: { txnType: 'Purchase'|'Deposit', checkNumber, amount, date, payee, memo }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createAuthenticatedClient(req);
  const tokens = await getTokens(supabase);
  if (!tokens) return res.status(400).json({ error: 'QuickBooks not connected' });

  let accessToken = tokens.access_token;
  const isExpired = tokens.expires_at && new Date(tokens.expires_at) <= new Date(Date.now() + 60_000);
  if (isExpired) {
    const refreshed = await refreshToken(supabase, tokens);
    if (refreshed) accessToken = refreshed;
  }

  const { txnType, checkNumber, amount, date, payee, memo } = req.body;
  if (!txnType || !amount || !date) {
    return res.status(400).json({ error: 'txnType, amount and date are required' });
  }

  const useSandbox = process.env.QB_SANDBOX === 'true';
  const base = useSandbox ? QBO_SANDBOX : QBO_BASE;
  const realmId = tokens.realm_id;
  const totalAmt = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;

  let payload: any;

  if (txnType === 'Purchase') {
    payload = {
      PaymentType: 'Check',
      AccountRef: { name: 'Checking' },
      TxnDate: date,
      DocNumber: checkNumber || '',
      TotalAmt: totalAmt,
      PrivateNote: memo || `[Kyriq] Created from vouched check #${checkNumber}`,
      ...(payee ? { EntityRef: { name: payee, type: 'Vendor' } } : {}),
      Line: [{
        DetailType: 'AccountBasedExpenseLineDetail',
        Amount: totalAmt,
        AccountBasedExpenseLineDetail: {
          AccountRef: { name: 'Uncategorized Expense' },
          BillableStatus: 'NotBillable',
        },
      }],
    };
  } else if (txnType === 'Deposit') {
    payload = {
      TxnDate: date,
      DocNumber: checkNumber || '',
      TotalAmt: totalAmt,
      DepositToAccountRef: { name: 'Undeposited Funds' },
      PrivateNote: memo || `[Kyriq] Created from vouched check #${checkNumber}`,
      Line: [{
        DetailType: 'DepositLineDetail',
        Amount: totalAmt,
        DepositLineDetail: {
          AccountRef: { name: 'Uncategorized Income' },
          ...(payee ? { Entity: { Type: 'Customer', EntityRef: { name: payee } } } : {}),
        },
      }],
    };
  } else {
    return res.status(400).json({ error: `Unsupported txnType: ${txnType}` });
  }

  const endpoint = txnType === 'Purchase' ? 'purchase' : 'deposit';
  const url = `${base}/v3/company/${realmId}/${endpoint}?minorversion=73`;

  const qbRes = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await qbRes.text();
  let data: any;
  try { data = JSON.parse(rawBody); } catch { data = { raw: rawBody }; }

  if (!qbRes.ok) {
    const fault = data?.Fault?.Error?.[0];
    const msg = fault?.Detail || fault?.Message || `QB API error (${qbRes.status})`;
    console.error(`create-check QB error (${txnType}):`, msg, rawBody.slice(0, 300));
    return res.status(400).json({ error: msg, qbRaw: data });
  }

  const created = data[txnType === 'Purchase' ? 'Purchase' : 'Deposit'];
  return res.status(200).json({
    success: true,
    qbId: created?.Id,
    txnType,
    docNumber: created?.DocNumber,
    totalAmt: created?.TotalAmt,
  });
}
