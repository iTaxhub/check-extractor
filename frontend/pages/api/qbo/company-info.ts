import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';
import { getQbToken, resolveQbConnection } from '@/lib/qb-token';
import { qbFetch } from '@/lib/qb-http';

const QBO_BASE = 'https://quickbooks.api.intuit.com';

/**
 * QuickBooks company information for the ACTIVE company.
 *
 *   GET  /api/qbo/company-info            cached read (hits QBO only if the
 *                                         stored company_name is missing)
 *   GET  /api/qbo/company-info?refresh=1  force a QBO pull
 *   POST /api/qbo/company-info            force a QBO pull
 *
 * This used to hit `/companyinfo/{realmId}` on EVERY call, from three callers
 * that only wanted the company name — a name that already sits in
 * `qb_connections.company_name` (migration 013) and effectively never changes.
 * Intuit's free read quota BLOCKS rather than bills at 500k reads a month, so a
 * live read per page load would take every customer's sync down at once when it
 * tripped. Same shape as qbo/accounts.ts and its qb_accounts cache: serve from
 * the database, touch QuickBooks only on an explicit refresh or when the stored
 * value is missing (a freshly connected company, which still gets a name).
 *
 * The legalName / email / phone / address fields are NOT stored, so they are
 * only present on a refreshed response — `cached: true` says which this is.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createAuthenticatedClient(req);

    const wantsRefresh =
      req.method === 'POST' || req.query.refresh === '1' || req.query.refresh === 'true';

    // Cached path: no Intuit read, and no token refresh either — the stored
    // name needs neither. One resolver (lib/qb-token.ts) so this answers for
    // the company the switcher says is active, not the legacy single-company
    // row.
    if (!wantsRefresh) {
      const conn = await resolveQbConnection(supabase);
      if (conn?.companyName) {
        return res.status(200).json({
          connected: true,
          cached: true,
          realmId: conn.realmId,
          companyName: conn.companyName,
        });
      }
      // No stored name (just connected, or the legacy row): fall through and
      // fetch it once, which also stores it for every later page load.
    }

    const token = await getQbToken(supabase);
    if (!token.ok) {
      return res.status(token.reason === 'not_connected' ? 400 : 401).json({
        error:
          token.reason === 'not_connected'
            ? 'QuickBooks not connected'
            : 'Failed to refresh token. Please reconnect to QuickBooks.',
        connected: false,
      });
    }
    const accessToken = token.accessToken;
    const realmId = token.connection.realmId;

    // Fetch company info from QuickBooks
    const companyInfoUrl = `${QBO_BASE}/v3/company/${realmId}/companyinfo/${realmId}?minorversion=73`;
    
    console.log('📡 Fetching QB company info:', {
      realmId: realmId,
      url: companyInfoUrl
    });

    const response = await qbFetch(companyInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ QB API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return res.status(response.status).json({ 
        error: 'Failed to fetch company info from QuickBooks',
        detail: errorText,
        connected: true
      });
    }

    const data = await response.json();
    const companyInfo = data.CompanyInfo;

    console.log('✅ QB Company Info fetched:', {
      companyName: companyInfo.CompanyName,
      legalName: companyInfo.LegalName,
      realmId: realmId
    });

    // Store company name in BOTH stores: integrations for the legacy readers,
    // qb_connections because that is the name the company switcher renders.
    await Promise.all([
      supabase
        .from('integrations')
        .update({
          company_name: companyInfo.CompanyName,
          updated_at: new Date().toISOString(),
        })
        .eq('provider', 'quickbooks'),
      supabase
        .from('qb_connections')
        .update({ company_name: companyInfo.CompanyName })
        .eq('realm_id', realmId),
    ]);

    // Separate write: until migration 051 adds the column this fails on its own
    // and must not take the company-name update down with it. Emails read it
    // to choose "check" or "cheque" (lib/spelling.ts).
    await supabase.from('qb_connections').update({ country: companyInfo.Country ?? null }).eq('realm_id', realmId);

    return res.status(200).json({
      connected: true,
      cached: false,
      realmId: realmId,
      companyName: companyInfo.CompanyName,
      legalName: companyInfo.LegalName,
      email: companyInfo.Email?.Address || null,
      phone: companyInfo.PrimaryPhone?.FreeFormNumber || null,
      address: companyInfo.CompanyAddr ? {
        line1: companyInfo.CompanyAddr.Line1,
        city: companyInfo.CompanyAddr.City,
        countrySubDivisionCode: companyInfo.CompanyAddr.CountrySubDivisionCode,
        postalCode: companyInfo.CompanyAddr.PostalCode,
      } : null,
    });
  } catch (error: any) {
    console.error('❌ Company info error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch company information',
      detail: error.message,
      connected: false
    });
  }
}
