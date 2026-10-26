/**
 * Every public, crawlable path, in one place.
 *
 * WHY: the auth proxy redirects any path it does not know to /login. That is
 * how /robots.txt and /sitemap.xml ended up 307-ing to the login page and how
 * a new marketing page silently disappears from Google. The proxy, robots.ts
 * and sitemap.ts all read this list, so adding a page here is the whole job.
 *
 * Kept free of imports: the proxy runs on every request.
 */

/** Pages with their own fixed URL. */
export const STATIC_MARKETING_PATHS = [
  '/',
  '/pricing',
  '/features',
  '/compare',
  '/guides',
  '/tools/micr-line-decoder',
  '/tools/outstanding-checks-template',
  '/support',
  '/privacy',
  '/terms',
  '/legal/eula',
] as const;

/** Path prefixes whose children are generated from lib/marketing/content. */
export const MARKETING_PREFIXES = ['/features', '/for', '/compare', '/guides', '/tools', '/ca', '/uk', '/legal'] as const;

/** Signed-out pages that must exist but never be indexed. */
export const NOINDEX_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/invite', '/mfa', '/qb-oauth-complete'] as const;

/** True for pages that need no session at all, so the proxy can skip the Supabase round-trip. */
export function isMarketingPath(pathname: string): boolean {
  return (
    (STATIC_MARKETING_PATHS as readonly string[]).includes(pathname) ||
    MARKETING_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  );
}
