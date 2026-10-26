/**
 * The one template every SEO content page renders through. Server component:
 * the copy is in the HTML with no hydration cost, which is the point.
 */
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui';
import { PROSE } from '@/components/landing/LegalShell';
import { JsonLd } from './JsonLd';
import { PAGES } from '@/lib/marketing/content';
import { pagePath, type MarketingPage, type Section } from '@/lib/marketing/types';
import { abs, article, breadcrumbs, faqPage } from '@/lib/marketing/schema';

export const SECTION_LABEL: Record<Section, string> = {
  features: 'Features',
  for: 'Who it’s for',
  compare: 'Compare',
  guides: 'Guides',
  ca: 'Canada',
  uk: 'United Kingdom',
};

/** Where a section's breadcrumb points. Sections without an index page skip that crumb. */
const SECTION_INDEX: Partial<Record<Section, string>> = {
  features: '/features',
  for: '/features',
  compare: '/compare',
  guides: '/guides',
};

/** Title for any internal path, so `related` can stay a list of plain paths. */
function linkTitle(path: string): string {
  const p = PAGES.find((x) => pagePath(x) === path);
  if (p) return p.h1;
  if (path === '/pricing') return 'Kyriq pricing';
  if (path.startsWith('/tools/micr')) return 'Free MICR line decoder';
  if (path.startsWith('/tools/outstanding')) return 'Free outstanding checks template';
  return path;
}

export function crumbsFor(p: MarketingPage) {
  const index = SECTION_INDEX[p.section];
  return [
    { name: 'Home', path: '/' },
    ...(index ? [{ name: SECTION_LABEL[p.section === 'for' ? 'features' : p.section], path: index }] : []),
    { name: p.h1, path: pagePath(p) },
  ];
}

export function MarketingArticle({ page: p }: { page: MarketingPage }) {
  const crumbs = crumbsFor(p);
  const schema: object[] = [article(p), breadcrumbs(crumbs)];
  if (p.faqs?.length) schema.push(faqPage(p.faqs));

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16" lang={p.locale ?? 'en-US'}>
      <JsonLd data={schema} />

      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-faint mb-6">
        <ol className="flex flex-wrap gap-1.5">
          {crumbs.map((c, i) => (
            <li key={c.path} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>›</span>}
              {i < crumbs.length - 1 ? (
                <Link href={c.path} className="hover:text-ink-strong">{c.name}</Link>
              ) : (
                <span aria-current="page" className="text-ink-soft line-clamp-1">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <article className="glass-card rounded-card p-6 sm:p-10">
        <span className="text-eyebrow text-brand mb-3 block">{p.eyebrow}</span>
        <h1 className="text-3xl sm:text-[2.6rem] font-extrabold text-ink-strong tracking-[-0.025em] leading-[1.1] mb-5">{p.h1}</h1>
        <p className="text-[17px] text-ink-soft leading-relaxed mb-4">{p.intro}</p>
        <p className="text-xs text-ink-faint mb-8">Last updated {p.updated}</p>

        <div className={PROSE}>
          {p.body.map((b) => (
            <section key={b.heading}>
              <h2>{b.heading}</h2>
              {b.paragraphs?.map((t, i) => <p key={i}>{t}</p>)}
              {b.steps && <ol>{b.steps.map((t, i) => <li key={i}>{t}</li>)}</ol>}
              {b.bullets && (
                <ul>
                  {b.bullets.map((t, i) => (
                    <li key={i}>{/^https?:\/\//.test(t) ? <a href={t} rel="nofollow noopener" target="_blank">{t}</a> : t}</li>
                  ))}
                </ul>
              )}
              {b.table && (
                <div className="overflow-x-auto mb-4">
                  <table>
                    <thead>
                      <tr>{b.table.head.map((h, i) => <th key={i} className="py-2 pr-4 border-b hairline">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {b.table.rows.map((r, i) => (
                        <tr key={i}>{r.map((c, j) => <td key={j} className="py-2 pr-4 border-b hairline align-top">{c}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-card bg-shell-solid p-6 sm:p-8 text-center">
          <p className="text-lg font-bold text-shell-text mb-2">Reconcile checks in QuickBooks Online in minutes</p>
          <p className="text-sm text-shell-muted mb-5">14-day trial or 250 checks, whichever comes first. No credit card required.</p>
          <Link href="/signup" className={cn(buttonVariants({ variant: 'primary', size: 'md' }))}>
            Start Free Trial <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </article>

      {p.faqs?.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-ink-strong tracking-[-0.02em] mb-4">Frequently asked questions</h2>
          <div className="grid gap-3">
            {p.faqs.map((f) => (
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
      ) : null}

      {p.related?.length ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-ink-strong mb-3">Related</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {p.related.map((path) => (
              <li key={path}>
                <Link href={path} className="flex items-start gap-2 text-sm text-brand-deep hover:text-brand-dark">
                  <Check size={14} className="mt-0.5 shrink-0" aria-hidden /> {linkTitle(path)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

/** A plain list of pages, for /features, /compare and /guides. */
export function SectionIndex({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: string; sections: Section[] }) {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: title,
          itemListElement: PAGES.filter((p) => sections.includes(p.section)).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: abs(pagePath(p)),
            name: p.h1,
          })),
        }}
      />
      <span className="text-eyebrow text-brand mb-3 block">{eyebrow}</span>
      <h1 className="text-3xl sm:text-[2.6rem] font-extrabold text-ink-strong tracking-[-0.025em] leading-[1.1] mb-4">{title}</h1>
      <p className="text-[17px] text-ink-soft leading-relaxed mb-10 max-w-2xl">{intro}</p>
      {sections.map((s) => (
        <section key={s} className="mb-10">
          {sections.length > 1 && <h2 className="text-xl font-bold text-ink-strong mb-4">{SECTION_LABEL[s]}</h2>}
          <div className="grid sm:grid-cols-2 gap-4">
            {PAGES.filter((p) => p.section === s).map((p) => (
              <Link key={p.slug} href={pagePath(p)} className="glass-card rounded-card p-6 hover-lift block">
                {/* h2 when there are no section headings, so the outline never skips a level. */}
                {sections.length > 1 ? (
                  <h3 className="text-[16px] font-bold text-ink-strong mb-2">{p.h1}</h3>
                ) : (
                  <h2 className="text-[16px] font-bold text-ink-strong mb-2">{p.h1}</h2>
                )}
                <p className="text-[13px] text-ink-body leading-relaxed">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
