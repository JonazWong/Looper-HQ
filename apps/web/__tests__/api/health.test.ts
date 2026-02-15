import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockPrismaClient, resetMockPrisma } from '@/__tests__/__mocks__/prisma'

// Mock dependencies BEFORE importing the route
vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}))

// Set environment variables for testing
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.OPENAI_BASE_URL = 'https://test.openrouter.ai/api/v1'
process.env.npm_package_version = '2.0.0'

// Import route AFTER mocking
import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
  beforeEach(() => {
    resetMockPrisma()
    vi.clearAllMocks()
  })

  it('should return healthy status with comprehensive checks', async () => {
    // Arrange
    mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

    // Act
    const response = await GET({} as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('uptime')
    expect(data).toHaveProperty('checks')
    expect(data.checks.database.status).toBe('ok')
    expect(data.checks.openai.configured).toBe(true)
    expect(data.checks.memory.status).toBe('ok')
    expect(data.version).toBe('2.0.0')
  })

  it('should return unhealthy status when database check fails', async () => {
    // Arrange
    mockPrismaClient.$queryRaw.mockRejectedValueOnce(new Error('Database connection failed'))

    // Act
    const response = await GET({} as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.database).toBe('disconnected')
    expect(data).toHaveProperty('error')
  })

  it('should include database response time', async () => {
    // Arrange
    mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

    // Act
    const response = await GET({} as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.checks.database).toHaveProperty('responseTime')
    expect(typeof data.checks.database.responseTime).toBe('number')
    expect(data.checks.database.responseTime).toBeGreaterThanOrEqual(0)
  })

  it('should report OpenAI configuration status', async () => {
    // Arrange
    mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

    // Act
    const response = await GET({} as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.checks.openai).toHaveProperty('configured')
    expect(data.checks.openai.configured).toBe(true)
    expect(data.checks.openai.status).toBe('ok')
  })

  it('should report when OpenAI is not configured', async () => {
    // Arrange
    const originalApiKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

    // Act
    const response = await GET({} as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')  // Still healthy, just AI not configured
    expect(data.checks.openai.status).toBe('not_configured')
    expect(data.checks.openai.configured).toBe(false)

    // Restore
    process.env.OPENAI_API_KEY = originalApiKey
  })

  it('should include memory usage information', async () => {
    // Arrange
    mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

    // Act
    const response = await GET({} as any)
    const data = await response.json()

    // Assert
    expect(data.checks.memory).toHaveProperty('used')
    expect(data.checks.memory).toHaveProperty('total')
    expect(data.checks.memory).toHaveProperty('percentage')
    expect(typeof data.checks.memory.used).toBe('number')
    expect(typeof data.checks.memory.total).toBe('number')
    expect(typeof data.checks.memory.percentage).toBe('number')
  })

  it('should warn when memory usage is high', async () => {
    // Arrange
    mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])
    
    // Mock high memory usage
    const originalMemoryUsage = process.memoryUsage
    process.memoryUsage = vi.fn().mockReturnValue({
      heapUsed: 950 * 1024 * 1024, // 950 MB
      heapTotal: 1000 * 1024 * 1024, // 1000 MB (95% usage)
      external: 0,
      rss: 0,
      arrayBuffers: 0,
    })

    // Act
    const response = await GET({} as any)
    const data = await response.json()

    // Assert
    expect(data.status).toBe('healthy')  // Still returns 200, but memory warning in check
    expect(data.checks.memory.status).toBe('warning')
    expect(data.checks.memory.percentage).toBeGreaterThan(90)

    // Restore
    process.memoryUsage = originalMemoryUsage
  })
})
