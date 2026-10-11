/**
 * admin-audit-list: the most recent audit_logs rows across every firm, for
 * the admin Audit Log page. audit_logs holds admin actions written by these
 * handlers (action 'admin.*'), comp grants and refunds from database
 * triggers, and check edits from the app. Shaped as the ported page expects.
 */
import type { AdminFn } from './index';

type Row = {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  check_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
};

const severity = (action: string) =>
  /delete|refund|revoke|ban|suspend/i.test(action) ? (/delete|refund/i.test(action) ? 'critical' : 'warning') : 'info';

const fn: AdminFn = async (body, { db }) => {
  const search = typeof body.search === 'string' ? body.search.trim().toLowerCase() : '';
  const { data, error } = await db
    .from('audit_logs')
    .select('id, tenant_id, user_id, check_id, action, entity_type, entity_id, metadata, new_values, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];

  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
  const tenantIds = [...new Set(rows.map((r) => r.tenant_id).filter(Boolean))] as string[];
  const [{ data: people }, { data: firms }] = await Promise.all([
    userIds.length ? db.from('user_profiles').select('id, email').in('id', userIds) : Promise.resolve({ data: [] }),
    tenantIds.length ? db.from('tenants').select('id, name').in('id', tenantIds) : Promise.resolve({ data: [] }),
  ]);
  const email = new Map((people ?? []).map((p: { id: string; email: string }) => [p.id, p.email]));
  const firm = new Map((firms ?? []).map((t: { id: string; name: string }) => [t.id, t.name]));

  const out = rows.map((r) => {
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      actor_email: email.get(r.user_id ?? '') || String(meta.granted_by_email ?? meta.actor_email ?? 'system'),
      action: r.action,
      target_type: r.entity_type ?? (r.check_id ? 'check' : firm.get(r.tenant_id ?? '') ? 'firm' : null),
      target_id: r.entity_id ?? r.check_id ?? (firm.get(r.tenant_id ?? '') || null),
      after: { firm: firm.get(r.tenant_id ?? '') ?? null, ...meta, ...(r.new_values ?? {}) },
      severity: severity(r.action),
      ip: null,
      created_at: r.created_at,
    };
  });
  return search ? out.filter((e) => `${e.action} ${e.actor_email} ${e.target_id ?? ''}`.toLowerCase().includes(search)) : out;
};

export default fn;
