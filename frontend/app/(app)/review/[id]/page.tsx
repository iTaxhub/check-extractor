import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveSpelling, spell } from '@/lib/spelling';
import { FileSearch } from 'lucide-react';
import { EmptyState, buttonVariants } from '@/components/ui';
import CheckImageViewer from './components/CheckImageViewer';
import FieldEditor from './components/FieldEditor';
import ApprovalActions from './components/ApprovalActions';
import ComparisonPanel from './components/ComparisonPanel';
import ValidationWarnings from './components/ValidationWarnings';
import AuditHistory from './components/AuditHistory';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Next 16: route params are a Promise. Reading `params.id` synchronously gave
// `undefined`, so every review silently bounced to the dashboard.
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // The process page links here with its job_id (text), not a cheque UUID.
  // Filtering checks.id by it is a Postgres cast error, so resolve the job
  // to its first cheque instead.
  const byJob = !UUID_RE.test(id);
  const { data: check, error } = await supabase
    .from('checks')
    .select('*')
    .eq(byJob ? 'job_id' : 'id', id)
    .order('check_id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (byJob && check) redirect(`/review/${check.id}`);

  // Server component, so useSpelling() is out: same rule, read here. The country
  // read fails quietly until migration 051 is applied (falls back to the locale).
  const { data: conn } = await supabase.from('qb_connections').select('country').eq('is_active', true).limit(1).maybeSingle();
  const to = resolveSpelling(conn?.country, (await headers()).get('accept-language'));
  const t = (text: string) => spell(text, to);

  // A real query failure goes to the (app) error boundary, which has a retry.
  if (error) throw error;
  if (!check) {
    return (
      <div className="mx-auto max-w-xl p-6" data-tone="brand">
        <EmptyState
          icon={<FileSearch />}
          title={t('This cheque isn’t here')}
          description="It may have been deleted, or it belongs to another company. Pick a document from your dashboard to keep reviewing."
          action={<Link href="/dashboard" className={buttonVariants({ size: 'sm' })}>Back to dashboard</Link>}
        />
      </div>
    );
  }

  // Get audit logs
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('check_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6" data-tone="brand">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink-strong">{t('Review cheque')}</h1>
          <p className="nums mt-1 text-sm text-ink-body">{t('Check')} #{check.check_number || 'N/A'}</p>
        </div>
        <ApprovalActions checkId={check.id} currentStatus={check.status} />
      </div>

      {/* Validation Warnings */}
      {check.validation_errors && check.validation_errors.length > 0 && (
        <ValidationWarnings
          errors={check.validation_errors}
          warnings={check.validation_warnings || []}
        />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Image */}
        <div className="space-y-6">
          <CheckImageViewer imageUrl={check.file_url} />

          {/* OCR vs AI Comparison */}
          <ComparisonPanel
            ocrResults={check.ocr_results}
            aiResults={check.ai_results}
          />
        </div>

        {/* Right Column - Fields */}
        <div className="space-y-6">
          <FieldEditor check={check} />

          {/* Audit History */}
          {auditLogs && auditLogs.length > 0 && (
            <AuditHistory logs={auditLogs} />
          )}
        </div>
      </div>
    </div>
  );
}
