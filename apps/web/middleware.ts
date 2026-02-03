import { auth } from "@/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/landing', '/login', '/register']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // API routes and static files are always allowed
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return
  }
  
  // Allow access to public routes
  if (isPublicRoute) {
    return
  }
  
  // Require authentication for all other routes
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
