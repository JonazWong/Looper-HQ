/**
 * NextAuth.js v5 Middleware
 * 
 * Protects routes and handles authentication redirects.
 * 
 * Protected routes:
 * - /dashboard/* - Requires authentication
 * - /api/* (except /api/auth/*) - Requires authentication
 * 
 * Public routes:
 * - / - Home page
 * - /login - Login page
 * - /register - Registration page
 * - /api/auth/* - NextAuth API routes
 * - /api/health - Health check endpoint
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Define route patterns
  const isPublicRoute = 
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")

  const isDashboardRoute = pathname.startsWith("/dashboard")
  const isApiRoute = pathname.startsWith("/api") && !pathname.startsWith("/api/auth")
  const isAuthRoute = pathname === "/login" || pathname === "/register"

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Require authentication for dashboard routes
  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Require authentication for API routes (except auth routes)
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json(
      { error: "Unauthorized", message: "You must be logged in to access this resource" },
      { status: 401 }
    )
  }

  // Allow the request to proceed
  return NextResponse.next()
})

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
}
