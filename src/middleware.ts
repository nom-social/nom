import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  try {
    // Create Supabase client for server-side request
    const supabase = createClient(cookies());
    
    // Get user from session
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user && !error) {
      // Set user context in Sentry for server-side requests
      Sentry.setUser({
        id: user.id,
        email: user.email || undefined,
        username: user.user_metadata?.user_name || undefined,
        ip_address: '{{auto}}',
      });
    } else {
      // Clear user context if no user
      Sentry.setUser(null);
    }
  } catch (error) {
    // If there's an error getting user, just continue without setting user context
    console.warn('Error setting user context in middleware:', error);
  }

  return NextResponse.next();
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
