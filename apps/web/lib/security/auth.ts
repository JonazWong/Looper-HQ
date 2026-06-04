import { NextRequest } from 'next/server';
import { AuthenticationError, AuthorizationError } from './api-response';

/**
 * Extract and validate JWT token from request
 */
export function getTokenFromRequest(request: NextRequest): string {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid Authorization header');
  }

  const token = authHeader.substring(7);

  if (!token) {
    throw new AuthenticationError('Empty token');
  }

  return token;
}

/**
 * Type for authenticated user context
 */
export interface AuthContext {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

/**
 * Require authentication middleware - verify token exists
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  try {
    const token = getTokenFromRequest(request);

    // In production, decode and verify the JWT token
    // This is a placeholder - integrate with your auth provider
    const context = decodeToken(token);

    if (!context) {
      throw new AuthenticationError('Invalid token');
    }

    // Check token expiration
    if (context.exp * 1000 < Date.now()) {
      throw new AuthenticationError('Token expired');
    }

    return context;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Authentication failed');
  }
}

/**
 * Require specific role middleware
 */
export async function requireRole(
  request: NextRequest,
  requiredRoles: string[]
): Promise<AuthContext> {
  const context = await requireAuth(request);

  const hasRequiredRole = requiredRoles.some((role) => context.roles.includes(role));

  if (!hasRequiredRole) {
    throw new AuthorizationError(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
  }

  return context;
}

/**
 * Simple JWT decode (without verification) - for demonstration
 * In production, use a proper JWT library like jsonwebtoken
 */
function decodeToken(token: string): AuthContext | null {
  try {
    // This is a simplified implementation
    // In production, use proper JWT verification with your secret key
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return decoded as AuthContext;
  } catch {
    return null;
  }
}

/**
 * Create mock authentication context (for testing)
 */
export function createMockAuthContext(overrides?: Partial<AuthContext>): AuthContext {
  const now = Math.floor(Date.now() / 1000);
  return {
    userId: 'user-123',
    email: 'user@example.com',
    roles: ['user'],
    iat: now,
    exp: now + 86400, // 24 hours
    ...overrides,
  };
}
