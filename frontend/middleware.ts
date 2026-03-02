import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  // Update session and get response
  const response = await updateSession(request);
  
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/legal/privacy',
    '/legal/terms',
    '/legal/eula',
    '/api/qbo/callback', // OAuth callback needs to be public
  ];

  // API routes that should be public
  const publicApiRoutes = [
    '/api/qbo/auth',
    '/api/qbo/callback',
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));

  // Allow public routes and API routes
  if (isPublicRoute || isPublicApiRoute) {
    return response;
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // files with extensions (images, fonts, etc.)
  ) {
    return response;
  }

  // For all other routes, check authentication
  // The session is already updated by updateSession()
  // If user is not authenticated, they'll be redirected by the layout or page
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
