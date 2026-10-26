/**
 * schema.org JSON-LD builders. Every value comes from data the page already
 * renders (PLANS, FAQS, page content), so the markup cannot promise more than
 * the page shows — Google treats a mismatch as spam.
 */
import { PLANS } from '@/lib/pricing';
import type { MarketingPage } from './types';
import { pagePath } from './types';

export const SITE_URL = 'https://kyriq.com';
export const abs = (path: string) => new URL(path, SITE_URL).toString();

// The published store listing; the env var can still override it.
const CHROME_STORE_URL =
  process.env.NEXT_PUBLIC_CHROME_EXTENSION_URL ||
  'https://chromewebstore.google.com/detail/apnglhjejjghgmcinkoeganejmkjmkpk';

export const organization = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': abs('/#organization'),
  name: 'Kyriq',
  url: SITE_URL,
  logo: abs('/brand/kyriq-logo.png'),
  email: 'support@kyriq.com',
  ...(CHROME_STORE_URL ? { sameAs: [CHROME_STORE_URL] } : {}),
});

export const website = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': abs('/#website'),
  name: 'Kyriq',
  url: SITE_URL,
  publisher: { '@id': abs('/#organization') },
});

export const softwareApplication = () => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kyriq',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Check reconciliation for QuickBooks Online',
  operatingSystem: 'Web, Chrome',
  url: SITE_URL,
  description:
    'Check reconciliation software for QuickBooks Online. Upload a bank statement, match every check, approve exact matches in bulk and clear approved checks in QBO.',
  publisher: { '@id': abs('/#organization') },
  offers: PLANS.map((p) => ({
    '@type': 'Offer',
    name: p.name,
    price: p.monthly,
    priceCurrency: 'USD',
    url: abs('/pricing'),
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: p.monthly,
      priceCurrency: 'USD',
      unitText: 'MONTH',
    },
  })),
});

export const faqPage = (faqs: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: abs(it.path),
  })),
});

export const article = (p: MarketingPage) => ({
  '@context': 'https://schema.org',
  '@type': p.section === 'guides' ? 'Article' : 'WebPage',
  headline: p.h1,
  description: p.description,
  url: abs(pagePath(p)),
  dateModified: p.updated,
  inLanguage: p.locale ?? 'en-US',
  author: { '@id': abs('/#organization') },
  publisher: { '@id': abs('/#organization') },
});
