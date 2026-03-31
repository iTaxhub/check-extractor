import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Allow Chrome extension origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Allow unauthenticated access only for public Supabase credentials
  // (needed so the extension can bootstrap auth before having a session)
  const isPublicRequest = !req.headers.authorization;

  if (isPublicRequest) {
    return res.status(200).json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      qbClientId: process.env.QUICKBOOKS_CLIENT_ID || '',
      geminiApiKey: '',
    });
  }

  try {
    const supabase = createAuthenticatedClient(req);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch tenant's integration record for any overrides (e.g. per-tenant Gemini key)
    const { data: integration } = await supabase
      .from('integrations')
      .select('gemini_api_key, qb_client_id')
      .eq('provider', 'quickbooks')
      .maybeSingle();

    const geminiApiKey =
      integration?.gemini_api_key || process.env.GEMINI_API_KEY || '';
    const qbClientId =
      integration?.qb_client_id || process.env.QUICKBOOKS_CLIENT_ID || '';

    return res.status(200).json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      qbClientId,
      geminiApiKey,
    });
  } catch (error: any) {
    console.error('Extension config error:', error);
    return res.status(500).json({ error: error.message });
  }
}
