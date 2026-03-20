import type { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';

/**
 * Delete a specific QuickBooks entry
 * DELETE /api/quickbooks/delete-entry?id={entry_id}
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Entry ID is required' });
  }

  try {
    const supabase = createAuthenticatedClient(req);

    console.log(`[DELETE-ENTRY] Attempting to delete QB entry: ${id}`);

    // Delete the specific entry (RLS ensures user can only delete their own tenant's data)
    const { error, data } = await supabase
      .from('qb_entries')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Failed to delete QB entry:', error);
      return res.status(500).json({ error: 'Failed to delete entry', details: error.message });
    }

    console.log(`[DELETE-ENTRY] Deleted ${data?.length || 0} entries`);

    return res.status(200).json({ success: true, message: 'Entry deleted successfully', deleted: data?.length || 0 });
  } catch (error: any) {
    console.error('Delete QB entry error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete entry' });
  }
}
