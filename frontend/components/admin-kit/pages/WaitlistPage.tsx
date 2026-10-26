'use client';

/**
 * Who has opted in to Kyriq IQ.
 *
 * Before this, "Join the waitlist" was a mailto:, so the only record of demand
 * was free text in one inbox and nobody could answer "how many people want
 * this". The landing form writes to public.waitlist (migration 040) and this
 * reads it back through /api/admin/waitlist, which is super-admin only.
 *
 * Deliberately a plain table and not a chart: the useful questions here are who
 * and when, and at waitlist sizes a list answers both better than a graph.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Mail, MailWarning, RefreshCw, Search, Users } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { cn } from '@/lib/utils';

type Row = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  note: string | null;
  source: string;
  confirmed_at: string | null;
  created_at: string;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export default function WaitlistPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/waitlist');
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status})`);
      }
      const d = await res.json();
      setRows(d.rows ?? []);
    } catch (err: any) {
      setError(err?.message || 'Could not load the waitlist.');
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.email, r.name, r.company, r.note].some((v) => v?.toLowerCase().includes(needle))
    );
  }, [rows, q]);

  const unconfirmed = rows?.filter((r) => !r.confirmed_at).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kyriq IQ waitlist"
        description="People who asked to be told when Kyriq IQ opens up."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Stat icon={Users} label="On the list" value={rows?.length ?? '-'} />
        <Stat
          icon={unconfirmed ? MailWarning : Mail}
          label="No confirmation sent"
          value={rows ? unconfirmed : '-'}
          warn={unconfirmed > 0}
        />

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
            <label htmlFor="wl-search" className="sr-only">Search the waitlist</label>
            <input
              id="wl-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search email, name, company"
              className="w-[260px] rounded-input border hairline bg-surface pl-9 pr-3 py-2 text-sm text-ink-body outline-none focus:ring-2 focus:ring-brand/25"
            />
          </div>
          <button
            onClick={load}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-btn border hairline bg-surface px-3 py-2 text-sm font-medium text-ink-body hover:bg-surface-raised disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <RefreshCw size={15} aria-hidden />}
            Refresh
          </button>
          {/* A plain link, not fetch+blob: the endpoint already sets
              Content-Disposition, so the browser does the download itself.
              next/link is wrong for this and the lint rule is misreading an API
              route as a page, routing to it client-side would try to render a
              CSV response as a page instead of downloading it. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/admin/waitlist?format=csv"
            className="inline-flex items-center gap-2 rounded-btn bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <Download size={15} aria-hidden /> CSV
          </a>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-card border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-card border hairline bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b hairline text-left text-xs uppercase tracking-wide text-ink-faint">
              <th scope="col" className="px-4 py-3 font-semibold">Email</th>
              <th scope="col" className="px-4 py-3 font-semibold">Name</th>
              <th scope="col" className="px-4 py-3 font-semibold">Company</th>
              <th scope="col" className="px-4 py-3 font-semibold">Confirmed</th>
              <th scope="col" className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows === null && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-faint">Loading…</td></tr>
            )}
            {rows !== null && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-faint">
                  {rows.length === 0 ? 'Nobody has joined the waitlist yet.' : 'No one matches that search.'}
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b hairline last:border-0">
                <td className="px-4 py-3">
                  <a href={`mailto:${r.email}`} className="font-medium text-brand hover:underline">{r.email}</a>
                </td>
                <td className="px-4 py-3 text-ink-body">{r.name || <span className="text-ink-faint">-</span>}</td>
                <td className="px-4 py-3 text-ink-body">{r.company || <span className="text-ink-faint">-</span>}</td>
                <td className="px-4 py-3">
                  {r.confirmed_at
                    ? <span className="text-ink-soft tabular-nums">{fmt(r.confirmed_at)}</span>
                    : <span className="rounded-pill bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">not sent</span>}
                </td>
                <td className="px-4 py-3 text-ink-soft tabular-nums">{fmt(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, warn,
}: { icon: typeof Users; label: string; value: number | string; warn?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-card border hairline bg-surface px-4 py-3">
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-tile', warn ? 'bg-warning/15 text-warning' : 'bg-brand/10 text-brand')}>
        <Icon size={16} aria-hidden />
      </span>
      <span>
        <span className="block text-xs text-ink-faint">{label}</span>
        <span className="block text-lg font-bold tabular-nums text-ink-strong">{value}</span>
      </span>
    </div>
  );
}
