import { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createAuthenticatedClient(req);
    
    // Get user's tenant_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return res.status(400).json({ error: 'User has no tenant' });
    }

    const { checkIdentifier, checkNumber, reason } = req.body;

    if (!checkIdentifier) {
      return res.status(400).json({ error: 'checkIdentifier is required' });
    }

    if (req.method === 'POST') {
      // Vouch the check (upsert)
      const { data, error } = await supabase
        .from('vouched_checks')
        .upsert({
          tenant_id: userData.tenant_id,
          check_identifier: checkIdentifier,
          check_number: checkNumber || null,
          vouched_by: user.id,
          vouched_at: new Date().toISOString(),
          reason: reason || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id,check_identifier'
        })
        .select()
        .single();

      if (error) {
        console.error('Error vouching check:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data });
    } else if (req.method === 'DELETE') {
      // Unvouch the check
      const { error } = await supabase
        .from('vouched_checks')
        .delete()
        .eq('tenant_id', userData.tenant_id)
        .eq('check_identifier', checkIdentifier);

      if (error) {
        console.error('Error unvouching check:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('Vouch API error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
