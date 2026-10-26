import type { MetadataRoute } from 'next';
import { STATIC_MARKETING_PATHS } from '@/lib/marketing/routes';
import { PAGES } from '@/lib/marketing/content';
import { pagePath } from '@/lib/marketing/types';
import { abs } from '@/lib/marketing/schema';

/** Static pages plus every content page. Legal pages are listed but weighted low. */
export default function sitemap(): MetadataRoute.Sitemap {
  const latest = PAGES.map((p) => p.updated).sort().at(-1);
  const staticEntries = STATIC_MARKETING_PATHS.map((path) => ({
    url: abs(path),
    lastModified: latest,
    priority: path === '/' ? 1 : ['/privacy', '/terms', '/legal/eula', '/support'].includes(path) ? 0.2 : 0.8,
  }));
  const contentEntries = PAGES.map((p) => ({
    url: abs(pagePath(p)),
    lastModified: p.updated,
    priority: p.section === 'guides' ? 0.6 : 0.7,
    ...(p.alternates
      ? { alternates: { languages: Object.fromEntries(Object.entries(p.alternates).map(([l, path]) => [l, abs(path!)])) } }
      : {}),
  }));
  return [...staticEntries, ...contentEntries];
}
