import { Pricing } from '@/components/landing/LandingPage';
import { JsonLd } from '@/components/marketing/JsonLd';
import { pageMetadata } from '@/components/marketing/sectionRoute';
import { FAQS } from '@/lib/marketing/faqs';
import { PLANS, formatUsd } from '@/lib/pricing';
import { breadcrumbs, faqPage, softwareApplication } from '@/lib/marketing/schema';

const [low, , high] = PLANS;

export const metadata = pageMetadata({
  title: 'Pricing: Check Reconciliation Software for QBO',
  description: `Kyriq pricing from ${formatUsd(low.monthly)}/month for ${low.allowance.toLocaleString('en-US')} checks to ${formatUsd(high.monthly)} for ${high.allowance.toLocaleString('en-US')}. Unlimited companies and users. 14-day free trial, no card.`,
  path: '/pricing',
});

/** The billing questions from the approved homepage FAQ, verbatim. */
const BILLING_FAQS = FAQS.filter((f) =>
  /allowance|free trial|companies and team|exceed|annual plans|extension included/i.test(f.q)
);

export default function PricingPage() {
  return (
    <main className="pt-24 sm:pt-28">
      <JsonLd
        data={[
          softwareApplication(),
          breadcrumbs([{ name: 'Home', path: '/' }, { name: 'Pricing', path: '/pricing' }]),
          faqPage(BILLING_FAQS),
        ]}
      />
      <header className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-3xl sm:text-[2.6rem] font-extrabold text-ink-strong tracking-[-0.025em] leading-[1.1] mb-4">
          Check reconciliation software pricing
        </h1>
        <p className="text-[17px] text-ink-soft leading-relaxed">
          Priced by processed-check volume, not by QuickBooks company or seat. Every plan includes unlimited companies,
          unlimited users and the Kyriq Chrome extension.
        </p>
      </header>
      <Pricing />
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-2xl font-extrabold text-ink-strong tracking-[-0.02em] mb-4">Billing questions</h2>
        <div className="grid gap-3">
          {BILLING_FAQS.map((f) => (
            <details key={f.q} className="glass-card rounded-card px-6 py-5 group">
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-[15px] font-semibold text-ink-strong">
                {f.q}
                <span className="shrink-0 text-brand group-open:rotate-45 transition-transform duration-quick" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-sm text-ink-body leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
