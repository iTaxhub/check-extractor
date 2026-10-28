import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // Try to create authenticated client, but handle missing auth gracefully
      let supabase;
      let integration = null;
      
      try {
        supabase = createAuthenticatedClient(req);
        
        // Fetch integration status from database
        const { data } = await supabase
          .from('integrations')
          .select('*')
          .eq('provider', 'quickbooks')
          .single();
        
        integration = data;
      } catch (authError: any) {
        // If no auth header, return basic config from env vars only
        console.warn('⚠️ No authentication for integrations GET:', authError.message);
        
        return res.status(200).json({
          qboConnected: false,
          qbConfigured: !!(process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET),
          credentialsExist: false,
          qbClientId: '',
          qbClientSecret: '',
          qbRedirectUri: process.env.QUICKBOOKS_REDIRECT_URI || '',
          geminiApiKey: '',
          companyId: null,
          realmId: null,
          companyName: null,
          lastSyncedAt: null,
        });
      }

      // Fallback to env vars if not in database
      const qbClientId = integration?.qb_client_id || process.env.QUICKBOOKS_CLIENT_ID || '';
      const qbClientSecret = integration?.qb_client_secret || process.env.QUICKBOOKS_CLIENT_SECRET || '';
      const qbRedirectUri = integration?.qb_redirect_uri || process.env.QUICKBOOKS_REDIRECT_URI || '';
      
      // Check if credentials exist in database
      const credentialsExist = !!(integration?.qb_client_id && integration?.qb_client_secret);
      
      // Most recent synced_at for this tenant (RLS scopes it). Never fails the route.
      let lastSyncedAt: string | null = null;
      try {
        let syncQuery = supabase
          .from('qb_transactions')
          .select('synced_at')
          .order('synced_at', { ascending: false, nullsFirst: false })
          .limit(1);
        if (integration?.realm_id) syncQuery = syncQuery.eq('realm_id', integration.realm_id);
        const { data: syncRows, error: syncError } = await syncQuery;
        if (!syncError) lastSyncedAt = syncRows?.[0]?.synced_at ?? null;
      } catch {
        lastSyncedAt = null;
      }

      // qb_connections is the source of truth (same order as lib/qb-token.ts);
      // the legacy integrations row is only a fallback.
      const { data: activeConns } = await supabase
        .from('qb_connections')
        .select('realm_id, company_name, access_token')
        .eq('is_active', true)
        .limit(1);
      const activeConn = activeConns?.[0] ?? null;

      return res.status(200).json({
        lastSyncedAt,
        qboConnected: activeConn ? !!activeConn.access_token : !!integration?.access_token,
        qbConfigured: !!(qbClientId && qbClientSecret),
        credentialsExist: credentialsExist,
        qbClientId: qbClientId ? '••••••••' + qbClientId.slice(-6) : '',
        qbClientSecret: qbClientSecret ? '••••••••' : '',
        qbRedirectUri: qbRedirectUri,
        geminiApiKey: integration?.gemini_api_key || '',
        companyId: integration?.company_id || null,
        realmId: activeConn?.realm_id || integration?.realm_id || null,
        companyName: activeConn?.company_name || integration?.company_name || null,
      });
    }

    // For PATCH requests, authentication is required
    const supabase = createAuthenticatedClient(req);

    if (req.method === 'PATCH') {
      // Update API keys and QB credentials
      const { geminiApiKey, qbClientId, qbClientSecret, qbRedirectUri } = req.body;

      // Get user's tenant_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🔍 [PATCH] User:', { user_id: user?.id, email: user?.email, error: userError?.message });
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      console.log('🔍 [PATCH] Profile:', { 
        user_id: user.id, 
        tenant_id: profile?.tenant_id, 
        error: profileError?.message 
      });

      if (!profile?.tenant_id) {
        console.error('❌ [PATCH] No tenant_id found for user:', user.id);
        return res.status(400).json({ error: 'User has no tenant assigned' });
      }

      const updates: any = {};
      if (geminiApiKey !== undefined) updates.gemini_api_key = geminiApiKey;
      if (qbClientId !== undefined) updates.qb_client_id = qbClientId;
      if (qbClientSecret !== undefined) updates.qb_client_secret = qbClientSecret;
      // Always enforce the canonical redirect URI — ignore client-supplied value
      updates.qb_redirect_uri = 'https://kyriq.com/api/qbo/callback';
      updates.updated_at = new Date().toISOString();

      // Upsert integration record with tenant_id
      const { error } = await supabase
        .from('integrations')
        .upsert({
          provider: 'quickbooks',
          tenant_id: profile.tenant_id,
          ...updates,
        }, {
          onConflict: 'tenant_id,provider'
        });

      if (error) {
        console.error('Failed to update integrations:', error);
        return res.status(500).json({ error: 'Failed to update settings' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Integration API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
