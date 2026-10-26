import type { MetadataRoute } from 'next';
import { NOINDEX_PATHS } from '@/lib/marketing/routes';
import { SITE_URL } from '@/lib/marketing/schema';

/**
 * Crawl the public site; stay out of the signed-in app and the API. The auth
 * pages are disallowed AND carry noindex (app/(auth)/layout.tsx) — the meta
 * tag is what actually keeps an already-linked URL out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        ...NOINDEX_PATHS,
        '/dashboard',
        '/upload',
        '/review',
        '/reconcile',
        '/reconciliation',
        '/history',
        '/export',
        '/reports',
        '/settings',
        '/billing',
        '/qb-comparisons',
        '/firm-dashboard',
        '/process',
        '/super-admin',
        '/admin',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
