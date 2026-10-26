import Link from 'next/link';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui';
import { JsonLd } from '@/components/marketing/JsonLd';
import { pageMetadata } from '@/components/marketing/sectionRoute';
import { PROSE } from '@/components/landing/LegalShell';
import { breadcrumbs } from '@/lib/marketing/schema';

export const metadata = pageMetadata({
  title: 'Free Outstanding Checks List and Check Register Template',
  description:
    'Download a free outstanding checks list template and check register template (CSV, opens in Excel or Google Sheets) to track uncleared checks at month-end.',
  path: '/tools/outstanding-checks-template',
});

const TEMPLATES = [
  {
    href: '/templates/outstanding-checks-template.csv',
    name: 'Outstanding checks list',
    desc: 'Check number, date issued, payee, amount, date cleared, days outstanding, status and follow-up action.',
  },
  {
    href: '/templates/check-register-template.csv',
    name: 'Check register',
    desc: 'Date, check number, payee, payment, deposit, running balance and cleared (C) or reconciled (R) status.',
  },
];

export default function OutstandingChecksTemplatePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
      <JsonLd
        data={breadcrumbs([
          { name: 'Home', path: '/' },
          { name: 'Outstanding checks template', path: '/tools/outstanding-checks-template' },
        ])}
      />
      <span className="text-eyebrow text-brand mb-3 block">Free template</span>
      <h1 className="text-3xl sm:text-[2.6rem] font-extrabold text-ink-strong tracking-[-0.025em] leading-[1.1] mb-4">
        Outstanding checks list and check register templates
      </h1>
      <p className="text-[17px] text-ink-soft leading-relaxed mb-8">
        Two free CSV templates for tracking checks that have been written but not yet cleared the bank. They open in
        Excel, Google Sheets or Numbers. No sign-up needed.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {TEMPLATES.map((t) => (
          <div key={t.href} className="glass-card rounded-card p-6 flex flex-col">
            <h2 className="text-[17px] font-bold text-ink-strong mb-2">{t.name}</h2>
            <p className="text-[13px] text-ink-body leading-relaxed mb-5 flex-1">{t.desc}</p>
            <a href={t.href} download className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}>
              <Download size={16} aria-hidden /> Download CSV
            </a>
          </div>
        ))}
      </div>

      <div className={PROSE}>
        <h2>How to use the outstanding checks list</h2>
        <ol>
          <li>At month-end, list every check written that has not appeared on the bank statement.</li>
          <li>When a check clears, fill in the date cleared and set the status to Cleared.</li>
          <li>Calculate days outstanding (statement date minus date issued) and follow up on anything older than 90 days.</li>
          <li>Checks outstanding for around six months are usually stale-dated. Agree with your accountant whether to void and reissue, and check your state or provincial unclaimed-property rules.</li>
        </ol>
        <h2>Doing this in QuickBooks Online</h2>
        <p>
          QuickBooks Online keeps the same information in the account register and the reconciliation report. Our guides
          cover <Link href="/guides/clear-outstanding-checks-quickbooks-online">clearing outstanding checks</Link> and{' '}
          <Link href="/guides/checks-not-showing-as-cleared-quickbooks-online">fixing checks that will not show as cleared</Link>.
        </p>
        <h2>Skip the spreadsheet</h2>
        <p>
          Kyriq reads every check on your bank statement, matches it to QuickBooks Online and clears the ones you approve,
          so the outstanding list is whatever is left. <Link href="/signup">Start a free trial</Link>.
        </p>
      </div>
    </main>
  );
}
