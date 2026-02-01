import { headers } from 'next/headers'
import { UnauthorizedError, ForbiddenError } from './errors'

export interface Session {
  user: {
    id: string
    email: string
    name?: string
    role: 'ADMIN' | 'LAWYER' | 'CLIENT' | 'STAFF'
    keycloakId?: string
  }
}

/**
 * Get the current session (placeholder until NextAuth is integrated)
 * For now, we'll return a mock session for development
 */
export async function getSession(): Promise<Session | null> {
  // TODO: Integrate with NextAuth
  // For now, return a mock admin session for development
  if (process.env.NODE_ENV === 'development') {
    return {
      user: {
        id: 'mock-admin-id',
        email: 'admin@looperhq.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
    }
  }
  
  return null
}

/**
 * Require authentication for API routes
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  
  if (!session) {
    throw new UnauthorizedError('You must be logged in to access this resource')
  }
  
  return session
}

/**
 * Require specific role for API routes
 */
export async function requireRole(
  ...allowedRoles: Array<'ADMIN' | 'LAWYER' | 'CLIENT' | 'STAFF'>
): Promise<Session> {
  const session = await requireAuth()
  
  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError('You do not have permission to access this resource')
  }
  
  return session
}

/**
 * Check if user has permission
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
  const permissions: Record<string, string[]> = {
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
    ],
    STAFF: [
      'case:read',
      'client:read',
      'document:read',
      'activity:read',
    ],
    CLIENT: [
      'case:read:own',
      'document:read:own',
      'activity:read:own',
    ],
  }
  
  return permissions[role]?.includes(permission) || false
}
