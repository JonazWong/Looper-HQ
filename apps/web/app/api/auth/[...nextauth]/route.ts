/**
 * NextAuth.js v5 API Route Handler
 * 
 * Handles all authentication routes:
 * - GET  /api/auth/signin - Sign in page
 * - POST /api/auth/signin/:provider - Sign in with provider
 * - GET  /api/auth/signout - Sign out page
 * - POST /api/auth/signout - Sign out
 * - GET  /api/auth/callback/:provider - OAuth callback
 * - GET  /api/auth/session - Get session
 * - GET  /api/auth/csrf - Get CSRF token
 * - GET  /api/auth/providers - Get configured providers
 */

import { handlers } from "@/auth"

export const { GET, POST } = handlers
