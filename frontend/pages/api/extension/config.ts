import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';
import { applyExtensionCors } from '@/lib/extension-cors';

/**
 * Per-tenant configuration for the Chrome extension.
 *
 * This returns secrets (the tenant's Gemini key, the Intuit client id), so it
 * requires a valid session. It previously served an unauthenticated branch to
 * any origin; the extension does not need that, because it ships the public
 * Supabase URL and anon key in its own BOOTSTRAP_CONFIG and merges those over
 * whatever this route returns.
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (applyExtensionCors(req, res, 'GET')) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createAuthenticatedClient(req);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // No provider keys and no `qbClientId` here. A Gemini key used to be served
    // for a direct-to-Google OCR call from the unused popup; a tenant's
    // provider key must never reach a browser extension, so that path was
    // removed. OCR runs server-side through the backend. QB OAuth goes through
    // /api/qbo/auth, which keeps the client id and secret on the server.
    return res.status(200).json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    });
  } catch (error: any) {
    console.error('Extension config error:', error);
    return res.status(500).json({ error: error.message });
  }
}
