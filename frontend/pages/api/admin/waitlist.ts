import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { isSuperAdmin } from '@/lib/super-admin';

/**
 * GET /api/admin/waitlist — who has opted in to Kyriq IQ.
 *
 * Super-admin only, authenticated from the session cookie exactly as the other
 * /api/admin routes do. The waitlist is personal data people handed over on a
 * public page, so it is not something a signed-in customer may read: migration
 * 040 revokes the table from anon and authenticated outright, and this route
 * reaches it with the service-role key after checking the caller.
 *
 * ?format=csv returns the same rows as a download, because the first thing
 * anyone wants to do with a waitlist is mail it from somewhere else.
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** RFC 4180: quote always, and double any embedded quote. */
const csvCell = (v: unknown): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { createServerClient } = await import('@supabase/ssr');
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({ name, value: value || '' }));
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isSuperAdmin(user.email)) {
    return res.status(403).json({ error: 'Forbidden: Super admin access required' });
  }

  const { data, error } = await supabaseAdmin
    .from('waitlist')
    .select('id, email, name, company, note, source, confirmed_at, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/waitlist] query failed:', error.message);
    return res.status(500).json({ error: 'Could not load the waitlist.' });
  }

  const rows = data ?? [];

  if (req.query.format === 'csv') {
    const header = ['Email', 'Name', 'Company', 'Note', 'Source', 'Confirmed', 'Joined'];
    const body = rows.map((r) =>
      [r.email, r.name, r.company, r.note, r.source, r.confirmed_at ? 'yes' : 'no', r.created_at]
        .map(csvCell)
        .join(',')
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="kyriq-iq-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send([header.map(csvCell).join(','), ...body].join('\r\n'));
  }

  return res.status(200).json({
    rows,
    total: rows.length,
    // Rows whose confirmation email never went out: the number worth noticing,
    // because it means those people got no receipt for signing up.
    unconfirmed: rows.filter((r) => !r.confirmed_at).length,
  });
}
