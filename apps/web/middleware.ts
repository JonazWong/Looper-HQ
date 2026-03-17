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
  localeDetection: false, // 禁用自动语言检测，避免自动跳转到 /en
});

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Skip static files and special Next.js paths
  if (
    pathname.includes('.') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Handle API routes separately
  if (pathname.startsWith('/api')) {
    const isAuthApi = pathname.startsWith('/api/auth');
    const isPublicApi = pathname === '/api/health' || 
                        pathname === '/api/public-cases' ||
                        pathname === '/api/translate' ||
                        pathname === '/api/embedding/search';
    
    if (!isAuthApi && !isPublicApi && !isLoggedIn) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Apply internationalization middleware first
  const response = intlMiddleware(req);

  // Extract locale from pathname (next-intl ensures locale is always present)
  const locale = pathname.split('/')[1] || defaultLocale;
  
  // Remove locale prefix for path checking
  const pathWithoutLocale = pathname.replace(/^\/(zh|en)/, '') || '/';
  
  const isDashboardRoute = pathWithoutLocale.startsWith('/dashboard');
  const isAuthRoute = pathWithoutLocale === '/login' || pathWithoutLocale === '/register';

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  // Require authentication for dashboard routes
  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
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
