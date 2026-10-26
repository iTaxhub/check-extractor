/**
 * The shape of every public SEO page (features, audiences, comparisons,
 * guides, Canada/UK cheque pages). Content is plain data so one server
 * template renders all of it and app/sitemap.ts can list it without a CMS.
 */

export type Section = 'features' | 'for' | 'compare' | 'guides' | 'ca' | 'uk';

export type Locale = 'en-US' | 'en-CA' | 'en-GB';

export interface Block {
  /** Rendered as an h2. Write it the way people search, not as a slogan. */
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Numbered how-to steps (ol). */
  steps?: string[];
  table?: { head: string[]; rows: string[][] };
}

export interface MarketingPage {
  section: Section;
  /** URL segment after the section, kebab-case. */
  slug: string;
  /** <title>, without the "| Kyriq" suffix (the root template adds it). Max ~60 chars. */
  title: string;
  /** Meta description, 140-160 chars, contains the main keyword once. */
  description: string;
  /** The main keyword this page targets. Not rendered; kept for review. */
  keyword: string;
  eyebrow: string;
  h1: string;
  intro: string;
  body: Block[];
  /** Rendered on the page and emitted as FAQPage JSON-LD. */
  faqs?: { q: string; a: string }[];
  /** Paths of related pages, e.g. '/guides/how-to-clear-checks-in-quickbooks-online'. */
  related?: string[];
  /** YYYY-MM-DD, shown as "Last updated" and used as sitemap lastModified. */
  updated: string;
  /** Defaults to en-US. */
  locale?: Locale;
  /** hreflang siblings, including this page itself. */
  alternates?: Partial<Record<Locale, string>>;
}

export const pagePath = (p: Pick<MarketingPage, 'section' | 'slug'>) => `/${p.section}/${p.slug}`;
