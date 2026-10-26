/**
 * Builds the three exports a content route needs. Each app/(marketing)/<section>/[slug]/page.tsx
 * is then four lines, and adding a page is only a content edit.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findPage, pagesIn } from '@/lib/marketing/content';
import { pagePath, type Section } from '@/lib/marketing/types';
import { MarketingArticle } from './MarketingArticle';

type Props = { params: Promise<{ slug: string }> };

const OG_IMAGE = { url: '/landing/og-card-1200x630.jpg', width: 1200, height: 630 };

/** Full metadata for one public page. openGraph is repeated in full because child metadata replaces it wholesale. */
export function pageMetadata(o: {
  title: string;
  description: string;
  path: string;
  locale?: string;
  languages?: Record<string, string>;
  type?: 'website' | 'article';
}): Metadata {
  return {
    // The root template appends " | Kyriq" (8 chars). Past 60 Google truncates,
    // so a long title drops the suffix instead of the keyword.
    title: o.title.length > 52 ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: { canonical: o.path, ...(o.languages ? { languages: o.languages } : {}) },
    openGraph: {
      title: o.title,
      description: o.description,
      url: o.path,
      type: o.type ?? 'website',
      siteName: 'Kyriq',
      locale: (o.locale ?? 'en-US').replace('-', '_'),
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: o.title, description: o.description, images: [OG_IMAGE.url] },
  };
}

export function sectionRoute(section: Section) {
  return {
    generateStaticParams: () => pagesIn(section).map((p) => ({ slug: p.slug })),

    async generateMetadata({ params }: Props): Promise<Metadata> {
      const p = findPage(section, (await params).slug);
      if (!p) return {};
      return pageMetadata({
        title: p.title,
        description: p.description,
        path: pagePath(p),
        locale: p.locale,
        languages: p.alternates as Record<string, string> | undefined,
        type: section === 'guides' ? 'article' : 'website',
      });
    },

    async Page({ params }: Props) {
      const p = findPage(section, (await params).slug);
      if (!p) notFound();
      return <MarketingArticle page={p} />;
    },
  };
}
