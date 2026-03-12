import { NextApiRequest, NextApiResponse } from 'next';
import { createAuthenticatedClient } from '@/lib/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Fetch all vouched checks for this tenant
    const { data, error } = await supabase
      .from('vouched_checks')
      .select('*')
      .eq('tenant_id', userData.tenant_id);

    if (error) {
      console.error('Error fetching vouched checks:', error);
      return res.status(500).json({ error: error.message });
    }

    // Return as a map for easy lookup
    const vouchedMap: Record<string, any> = {};
    (data || []).forEach(item => {
      vouchedMap[item.check_identifier] = {
        vouchedBy: item.vouched_by,
        vouchedAt: item.vouched_at,
        reason: item.reason,
      };
    });

    return res.status(200).json({ vouched: vouchedMap });
  } catch (error) {
    console.error('Vouched checks API error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
