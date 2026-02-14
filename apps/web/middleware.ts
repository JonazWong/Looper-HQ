/**
 * Combined Middleware - next-intl + NextAuth.js v5
 * 
 * Handles both internationalization and authentication:
 * 
 * i18n routes:
 * - /zh/* - Chinese locale
 * - /en/* - English locale
 * 
 * Protected routes:
 * - /[locale]/dashboard/* - Requires authentication
 * - /api/* (except /api/auth/*) - Requires authentication
 * 
 * Public routes:
 * - /[locale]/ - Home page
 * - /[locale]/login - Login page
 * - /[locale]/register - Registration page
 * - /api/auth/* - NextAuth API routes
 */

import { auth } from "@/auth"
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { locales, defaultLocale } from './i18n';

// Development mode check (module-level constant)
const isDev = process.env.NODE_ENV === 'development';

// Create next-intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

// Public paths that don't need authentication (without locale prefix)
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/case-search',
  '/landing',
  '/sitemap',
];

// Helper to check if path is public
function isPublicPath(pathname: string): boolean {
  // Remove locale prefix to check the base path
  const pathWithoutLocale = pathname.replace(/^\/(zh|en)/, '') || '/';
  
  return (
    publicPaths.includes(pathWithoutLocale) ||
    pathname.startsWith('/api/auth') ||
    pathname === '/api/health' ||
    pathname === '/api/public-cases' ||
    pathname === '/api/translate' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Skip middleware for API routes (except those requiring auth)
  if (pathname.startsWith('/api')) {
    const isAuthApi = pathname.startsWith('/api/auth');
    const isPublicApi = pathname === '/api/health' || 
                        pathname === '/api/public-cases' ||
                        pathname === '/api/translate';
    
    if (!isAuthApi && !isPublicApi && !isLoggedIn) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (isDev) {
    console.log('[Middleware] Incoming request:', { pathname, isLoggedIn });
  }

  // Apply internationalization middleware for non-API routes
  const response = intlMiddleware(req);

  // Safely extract pathname after intl middleware processes it
  // The header may not exist if intl middleware redirects or modifies the request
  let newPathname = pathname;
  
  // Check if this is a redirect response
  const isRedirect = response.status >= 300 && response.status < 400;
  
  if (isRedirect) {
    // For redirects, extract locale from the Location header
    const location = response.headers.get('location');
    if (location) {
      try {
        const redirectUrl = new URL(location, req.url);
        newPathname = redirectUrl.pathname;
        if (isDev) {
          console.log('[Middleware] Redirect detected:', { from: pathname, to: newPathname });
        }
      } catch (e) {
        // Fallback to original pathname if URL parsing fails
        newPathname = pathname;
        if (isDev) {
          console.error('[Middleware] Failed to parse redirect URL:', {
            location,
            error: e instanceof Error ? e.message : String(e)
          });
        }
      }
    }
  } else {
    // For non-redirects, check the header (may not exist)
    const headerPathname = response.headers.get('x-middleware-request-x-nexturl-pathname');
    if (headerPathname) {
      newPathname = headerPathname;
    }
  }
  
  // Extract locale from pathname (zh or en)
  const localeMatch = newPathname.match(/^\/(zh|en)/);
  const locale = localeMatch ? localeMatch[1] : defaultLocale;
  
  // Remove locale prefix for auth checks
  const pathWithoutLocale = newPathname.replace(/^\/(zh|en)/, '') || '/';
  
  const isDashboardRoute = pathWithoutLocale.startsWith('/dashboard');
  const isAuthRoute = pathWithoutLocale === '/login' || pathWithoutLocale === '/register';
  const isPublic = isPublicPath(newPathname);

  if (isDev) {
    console.log('[Middleware] Processing:', {
      originalPath: pathname,
      newPathname,
      locale,
      pathWithoutLocale,
      isDashboardRoute,
      isAuthRoute,
      isPublic,
      isLoggedIn,
      isRedirect
    });
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    if (isDev) {
      console.log('[Middleware] Redirecting logged-in user from auth page to dashboard');
    }
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  // Require authentication for dashboard routes
  if (isDashboardRoute && !isLoggedIn) {
    if (isDev) {
      console.log('[Middleware] Redirecting unauthenticated user to login');
    }
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", newPathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isDev) {
    console.log('[Middleware] Returning response:', { status: response.status });
  }

  return response;
});

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
