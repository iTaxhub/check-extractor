import type { NextApiRequest, NextApiResponse } from 'next';
import { createClientFromCookies, createServiceClient } from '@/lib/supabase/api';

/**
 * QuickBooks OAuth Callback Endpoint
 * Handles the OAuth callback and exchanges code for tokens
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, realmId } = req.query;

    if (!code || !state || !realmId) {
      return res.redirect('/settings?error=missing_params');
    }

    // Verify state (CSRF protection) - optional in development
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    // Skip state validation if no cookie (development mode)
    if (cookies?.qbo_state && cookies.qbo_state !== state) {
      console.warn('State mismatch - possible CSRF attack');
      return res.redirect('/settings?error=invalid_state');
    }
    
    // Log for debugging
    console.log('OAuth callback received:', { code: code?.toString().substring(0, 20) + '...', realmId, hasState: !!state });

    // Use SERVICE CLIENT to read QB credentials (bypasses RLS — credentials aren't user-scoped)
    // This avoids the fragile cookie-based auth that fails with chunked Supabase cookies
    let serviceClient;
    let integration = null;
    try {
      serviceClient = createServiceClient();
      const { data, error: dbError } = await serviceClient
        .from('integrations')
        .select('qb_client_id, qb_client_secret, qb_redirect_uri, tenant_id')
        .eq('provider', 'quickbooks')
        .limit(1)
        .single();
      
      if (dbError) {
        console.warn('⚠️ Service client DB read failed:', dbError.message);
      } else {
        integration = data;
      }
    } catch (svcErr: any) {
      console.warn('⚠️ Service client unavailable, falling back to cookie auth:', svcErr.message);
    }

    // Fallback: try cookie-based client if service client didn't work
    if (!integration) {
      try {
        const cookieClient = createClientFromCookies(req);
        const { data } = await cookieClient
          .from('integrations')
          .select('qb_client_id, qb_client_secret, qb_redirect_uri, tenant_id')
          .eq('provider', 'quickbooks')
          .single();
        integration = data;
      } catch (cookieErr: any) {
        console.warn('⚠️ Cookie client also failed:', cookieErr.message);
      }
    }

    // Fallback to env vars
    const clientId = integration?.qb_client_id || process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = integration?.qb_client_secret || process.env.QUICKBOOKS_CLIENT_SECRET;
    const redirectUri = integration?.qb_redirect_uri || process.env.QUICKBOOKS_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/qbo/callback`;
    
    console.log('🔑 QB Callback credentials source:', {
      fromDB: !!integration?.qb_client_id,
      fromEnv: !integration?.qb_client_id && !!clientId,
      redirectUri,
    });

    if (!clientId || !clientSecret) {
      return res.redirect('/settings?tab=integrations&error=not_configured');
    }

    console.log('🔄 Exchanging authorization code for tokens...', {
      clientIdPrefix: clientId.substring(0, 10) + '...',
      redirectUri,
      codePrefix: (code as string).substring(0, 20) + '...',
    });

    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        clientIdPrefix: clientId.substring(0, 10) + '...',
        redirectUri,
      });
      return res.redirect(`/settings?tab=integrations&error=token_exchange_failed&detail=${encodeURIComponent(errorText.substring(0, 100))}`);
    }

    const tokens = await tokenResponse.json();

    // --- Get tenant_id from integration record (no user session required) ---
    // The integration record already has tenant_id from when credentials were saved
    const tenantId = integration?.tenant_id;

    if (!tenantId) {
      console.error('❌ QB Callback: No tenant_id in integration record');
      return res.redirect('/settings?error=no_tenant&detail=integration_missing_tenant');
    }

    console.log('✅ Using tenant_id from integration:', tenantId);

    // Save tokens to integrations table using service client
    if (!serviceClient) {
      console.error('❌ Service client not available for saving tokens');
      return res.redirect('/settings?error=service_unavailable');
    }

    const { error: saveError } = await serviceClient
      .from('integrations')
      .upsert({
        provider: 'quickbooks',
        tenant_id: tenantId,
        realm_id: realmId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,provider'
      });

    if (saveError) {
      console.error('Failed to store tokens:', saveError);
      return res.redirect('/settings?error=storage_failed');
    }

    // Clear state cookie
    res.setHeader('Set-Cookie', 'qbo_state=; Path=/; HttpOnly; Max-Age=0');

    // Redirect to settings with success
    return res.redirect('/settings?tab=integrations&success=quickbooks_connected');
  } catch (error) {
    console.error('QuickBooks callback error:', error);
    return res.redirect('/settings?error=callback_failed');
  }
}
