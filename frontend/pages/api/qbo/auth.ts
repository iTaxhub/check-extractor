import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';

/**
 * QuickBooks OAuth Authentication Endpoint
 * Initiates OAuth flow for QuickBooks Online
 * Reads credentials from database instead of environment variables
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get QuickBooks credentials from database
    const supabase = createAuthenticatedClient(req);

    // Get user's tenant_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    const tenantId = userData?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'No tenant found for user' });
    }

    const { data: integration, error: dbError } = await supabase
      .from('integrations')
      .select('qb_client_id, qb_redirect_uri')
      .eq('provider', 'quickbooks')
      .eq('tenant_id', tenantId)
      .single();

    console.log('🔍 QB OAuth - Integration data:', {
      hasIntegration: !!integration,
      hasClientId: !!integration?.qb_client_id,
      hasRedirectUri: !!integration?.qb_redirect_uri,
      dbError: dbError?.message
    });

    // Fallback to env vars if not in database
    const clientId = integration?.qb_client_id || process.env.QUICKBOOKS_CLIENT_ID;
    const redirectUri = integration?.qb_redirect_uri || process.env.QUICKBOOKS_REDIRECT_URI || '';
    
    console.log('🔑 QB OAuth - Using credentials:', {
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
      redirectUri,
      source: integration?.qb_client_id ? 'database' : 'env'
    });
    
    if (!clientId) {
      console.error('❌ QB OAuth - No client ID found in database or environment');
      return res.status(400).json({ 
        error: 'QuickBooks OAuth not configured',
        detail: 'QuickBooks Client ID is missing. Please save your credentials in Settings → Integrations → Configure Credentials',
        configured: false
      });
    }

    // Generate state for CSRF protection - encode tenant_id in it
    const stateData = {
      random: Math.random().toString(36).substring(7),
      tenant_id: tenantId,
      timestamp: Date.now()
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    
    // Store state in session/cookie for verification (optional - state is self-contained)
    res.setHeader('Set-Cookie', `qbo_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`);

    // QuickBooks OAuth URL
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('scope', 'com.intuit.quickbooks.accounting');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', state);

    console.log('✅ QB OAuth URL generated with tenant_id in state');

    return res.status(200).json({ authUrl: authUrl.toString() });
  } catch (error: any) {
    console.error('❌ QuickBooks auth error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: 'Failed to initiate QuickBooks connection',
      detail: error.message 
    });
  }
}
