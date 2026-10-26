import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static and metadata files: images, robots.txt, sitemap.xml, llms.txt,
     *   the web manifest and downloadable templates. Running auth on them
     *   redirected crawlers to /login.
     * - /.well-known/* and *.json: discovery probes (ai-catalog.json, A2A,
     *   OAuth metadata). Redirected to /login they answered 200 with HTML, a
     *   soft 404; skipped here they get Next's real 404.
     */
    '/((?!_next/static|_next/image|favicon.ico|\\.well-known/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|csv|json|webmanifest)$).*)',
  ],
};
