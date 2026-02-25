import { vi } from 'vitest'
import type { Session } from 'next-auth'

export const mockSession: Session = {
  user: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'LAWYER',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockAdminSession: Session = {
  user: {
    id: 'admin-123',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockClientSession: Session = {
  user: {
    id: 'client-123',
    name: 'Client User',
    email: 'client@example.com',
    role: 'CLIENT',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

// Mock auth function
export const mockAuth = vi.fn<[], Promise<Session | null>>(() => Promise.resolve(mockSession))

// Mock requireAuth function
export const mockRequireAuth = vi.fn<[], Promise<Session | null>>(() => Promise.resolve(mockSession))

// Helper to set mock session
export const setMockSession = (session: Session | null) => {
  mockAuth.mockResolvedValue(session)
  mockRequireAuth.mockResolvedValue(session)
}
