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

  // Apply internationalization middleware for non-API routes
  const response = intlMiddleware(req);

  // Get the pathname after intl middleware processes it
  const newPathname = response.headers.get('x-middleware-request-x-nexturl-pathname') || pathname;
  
  // Remove locale prefix for auth checks
  const pathWithoutLocale = newPathname.replace(/^\/(zh|en)/, '') || '/';
  
  const isDashboardRoute = pathWithoutLocale.startsWith('/dashboard');
  const isAuthRoute = pathWithoutLocale === '/login' || pathWithoutLocale === '/register';
  const isPublic = isPublicPath(newPathname);

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    const locale = newPathname.split('/')[1];
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  // Require authentication for dashboard routes
  if (isDashboardRoute && !isLoggedIn) {
    const locale = newPathname.split('/')[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", newPathname);
    return NextResponse.redirect(loginUrl);
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
