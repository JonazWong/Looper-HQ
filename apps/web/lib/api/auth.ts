import { auth } from '@/auth'
import { UnauthorizedError, ForbiddenError } from './errors'
import type { Session as NextAuthSession } from 'next-auth'
import { UserRole } from '@prisma/client'

// Re-export Session type from NextAuth
export type Session = NextAuthSession

/**
 * Get the current server session (NextAuth v5)
 * Use this in Server Components, Server Actions, and API Routes
 */
export async function getServerSession(): Promise<Session | null> {
  return await auth()
}

/**
 * Require authentication for API routes and Server Actions
 * Throws UnauthorizedError if not authenticated
 * 
 * @example
 * ```ts
 * export async function GET() {
 *   const session = await requireAuth()
 *   // User is authenticated
 * }
 * ```
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth()
  
  if (!session || !session.user) {
    throw new UnauthorizedError('You must be logged in to access this resource')
  }
  
  return session
}

/**
 * Require specific role(s) for API routes and Server Actions
 * Throws UnauthorizedError if not authenticated
 * Throws ForbiddenError if user doesn't have required role
 * 
 * @example
 * ```ts
 * export async function DELETE() {
 *   const session = await requireRole('ADMIN', 'LAWYER')
 *   // User is authenticated and has ADMIN or LAWYER role
 * }
 * ```
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<Session> {
  const session = await requireAuth()
  
  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError(
      `Access denied. Required role: ${allowedRoles.join(' or ')}`
    )
  }
  
  return session
}

/**
 * Check if user has permission based on role
 * 
 * @example
 * ```ts
 * const session = await requireAuth()
 * if (hasPermission(session, 'case:delete')) {
 *   // User can delete cases
 * }
 * ```
 */
export function hasPermission(
  session: Session,
  permission: string
): boolean {
  const { role } = session.user
  
  // Admin has all permissions
  if (role === 'ADMIN') {
    return true
  }
  
  // Define role-based permissions
  const permissions: Record<UserRole, string[]> = {
    ADMIN: [], // All permissions
    LAWYER: [
      'case:read',
      'case:write',
      'case:delete',
      'client:read',
      'client:write',
      'document:read',
      'document:write',
      'activity:read',
      'activity:write',
      'timelog:read',
      'timelog:write',
      'invoice:read',
      'invoice:write',
    ],
    STAFF: [
      'case:read',
      'client:read',
      'document:read',
      'activity:read',
      'timelog:read',
      'invoice:read',
    ],
    CLIENT: [
      'case:read:own',
      'document:read:own',
      'activity:read:own',
      'invoice:read:own',
    ],
  }
  
  return permissions[role]?.includes(permission) || false
}

/**
 * Check if user can access a specific resource
 * Useful for checking ownership of resources
 * 
 * @example
 * ```ts
 * const session = await requireAuth()
 * const case = await prisma.case.findUnique({ where: { id } })
 * 
 * if (!canAccessResource(session, case.clientId)) {
 *   throw new ForbiddenError('You cannot access this case')
 * }
 * ```
 */
export function canAccessResource(
  session: Session,
  resourceOwnerId: string
): boolean {
  const { id, role } = session.user
  
  // Admins and lawyers can access all resources
  if (role === 'ADMIN' || role === 'LAWYER' || role === 'STAFF') {
    return true
  }
  
  // Clients can only access their own resources
  if (role === 'CLIENT') {
    return id === resourceOwnerId
  }
  
  return false
}
