import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest } from 'next';

/**
 * Create an authenticated Supabase client for API routes.
 * Uses the user's auth token from the request, which enforces RLS policies.
 * 
 * @param req - The Next.js API request object
 * @returns Authenticated Supabase client that respects RLS
 */
export function createAuthenticatedClient(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );
}

/**
 * Create an authenticated Supabase client from cookies.
 * Used for OAuth callbacks where Authorization header is not available.
 * 
 * @param req - The Next.js API request object
 * @returns Authenticated Supabase client that respects RLS
 */
export function createClientFromCookies(req: NextApiRequest) {
  // Parse cookies to get the auth token
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  // Look for Supabase auth token in cookies
  const authToken = cookies?.['sb-oqtprhptsjzpxtvbuhbv-auth-token'] || 
                    cookies?.['sb-yqbmzerdagqevjdwhlwh-auth-token'];

  if (!authToken) {
    throw new Error('No auth token found in cookies');
  }

  // Parse the token (it's base64 encoded JSON)
  let token: string;
  try {
    const decoded = JSON.parse(Buffer.from(authToken, 'base64').toString());
    token = decoded.access_token || decoded[0];
  } catch {
    token = authToken;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );
}

/**
 * Create a service role Supabase client (bypasses RLS).
 * ⚠️ Only use this for admin operations where you need to bypass RLS.
 * For normal user operations, use createAuthenticatedClient() instead.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
