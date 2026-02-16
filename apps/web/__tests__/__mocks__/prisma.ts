import { vi } from 'vitest'
import type { PrismaClient } from '@looper-hq/database'

// Mock Prisma Client
export const mockPrismaClient = {
  case: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  client: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  invoice: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  timeLog: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  activity: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  document: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $disconnect: vi.fn(),
  $connect: vi.fn(),
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
} as unknown as PrismaClient

export const resetMockPrisma = () => {
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          method.mockReset()
        }
      })
    }
  })
}
