import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';

/**
 * QuickBooks Disconnect Endpoint
 * Revokes QuickBooks connection and removes stored tokens
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createAuthenticatedClient(req);

    // Delete QuickBooks integration
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('provider', 'quickbooks');

    if (error) {
      console.error('Failed to disconnect QuickBooks:', error);
      return res.status(500).json({ error: 'Failed to disconnect' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('QuickBooks disconnect error:', error);
    return res.status(500).json({ error: 'Failed to disconnect QuickBooks' });
  }
}
