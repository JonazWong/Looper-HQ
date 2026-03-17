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
Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true }) // Allow detailed checks in tests
process.env.HEALTH_CHECK_SECRET = 'test-secret-key'

// Import route AFTER mocking
import { GET } from '@/app/api/health/route'

// Helper to create mock request
function createMockRequest(url: string, headers: Record<string, string> = {}) {
  return {
    url,
    headers: {
      get: (name: string) => headers[name] || null,
    },
  } as any
}

describe('GET /api/health', () => {
  beforeEach(() => {
    resetMockPrisma()
    vi.clearAllMocks()
  })

  describe('Public Health Check (minimal info)', () => {
    it('should return basic healthy status without detailed metrics', async () => {
      // Arrange
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

      // Act - no detailed param
      const response = await GET(createMockRequest('http://localhost:3000/api/health'))
      const data = await response.json()

      // Assert - only basic info exposed
      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.database).toBe('connected')
      expect(data).toHaveProperty('timestamp')
      
      // Should NOT have detailed metrics
      expect(data).not.toHaveProperty('uptime')
      expect(data).not.toHaveProperty('version')
      expect(data).not.toHaveProperty('checks')
      expect(data).not.toHaveProperty('environment')
    })

    it('should return basic unhealthy status on database failure', async () => {
      // Arrange
      mockPrismaClient.$queryRaw.mockRejectedValueOnce(new Error('Database connection failed'))

      // Act
      const response = await GET(createMockRequest('http://localhost:3000/api/health'))
      const data = await response.json()

      // Assert
      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.database).toBe('disconnected')
      expect(data).toHaveProperty('timestamp')
      
      // Should NOT leak error details
      expect(data).not.toHaveProperty('checks')
    })
  })

  describe('Detailed Health Check (internal/authenticated)', () => {
    it('should return comprehensive checks in development with detailed=true', async () => {
      // Arrange
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

      // Act - development mode allows detailed without header
      const response = await GET(createMockRequest('http://localhost:3000/api/health?detailed=true'))
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('uptime')
      expect(data).toHaveProperty('version')
      expect(data).toHaveProperty('environment')
      expect(data).toHaveProperty('checks')
      expect(data.checks.database.status).toBe('ok')
      expect(data.checks.openai.configured).toBe(true)
      expect(data.checks.memory.status).toBe('ok')
      expect(data.version).toBe('2.0.0')
    })

    it('should return detailed metrics with internal header', async () => {
      // Arrange
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true }) // Simulate production
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

      // Act - with internal header
      const response = await GET(createMockRequest(
        'http://localhost:3000/api/health?detailed=true',
        { 'X-Internal-Health-Check': 'test-secret-key' }
      ))
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('checks')
      expect(data.checks.database).toHaveProperty('responseTime')
      
      // Restore
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
    })

    it('should include database response time in detailed mode', async () => {
      // Arrange
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

      // Act
      const response = await GET(createMockRequest('http://localhost:3000/api/health?detailed=true'))
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.checks.database).toHaveProperty('responseTime')
      expect(typeof data.checks.database.responseTime).toBe('number')
      expect(data.checks.database.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('should report OpenAI configuration status in detailed mode', async () => {
      // Arrange
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

      // Act
      const response = await GET(createMockRequest('http://localhost:3000/api/health?detailed=true'))
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.checks.openai).toHaveProperty('configured')
      expect(data.checks.openai.configured).toBe(true)
      expect(data.checks.openai.status).toBe('ok')
    })

    it('should report when OpenAI is not configured in detailed mode', async () => {
      // Arrange
      const originalApiKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

      // Act
      const response = await GET(createMockRequest('http://localhost:3000/api/health?detailed=true'))
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.checks.openai.status).toBe('not_configured')
      expect(data.checks.openai.configured).toBe(false)

      // Restore
      process.env.OPENAI_API_KEY = originalApiKey
    })

    it('should include memory usage information in detailed mode', async () => {
      // Arrange
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

      // Act
      const response = await GET(createMockRequest('http://localhost:3000/api/health?detailed=true'))
      const data = await response.json()

      // Assert
      expect(data.checks.memory).toHaveProperty('used')
      expect(data.checks.memory).toHaveProperty('total')
      expect(data.checks.memory).toHaveProperty('percentage')
      expect(typeof data.checks.memory.used).toBe('number')
      expect(typeof data.checks.memory.total).toBe('number')
      expect(typeof data.checks.memory.percentage).toBe('number')
    })

    it('should warn when memory usage is high in detailed mode', async () => {
      // Arrange
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])
      
      // Mock high memory usage
      const memoryUsageSpy = vi.spyOn(process, 'memoryUsage').mockReturnValue({
        heapUsed: 950 * 1024 * 1024, // 950 MB
        heapTotal: 1000 * 1024 * 1024, // 1000 MB (95% usage)
        external: 0,
        rss: 0,
        arrayBuffers: 0,
      })

      // Act
      const response = await GET(createMockRequest('http://localhost:3000/api/health?detailed=true'))
      const data = await response.json()

      // Assert
      expect(data.status).toBe('healthy')
      expect(data.checks.memory.status).toBe('warning')
      expect(data.checks.memory.percentage).toBeGreaterThan(90)

      // Restore
      memoryUsageSpy.mockRestore()
    })
  })

  describe('Security', () => {
    it('should not expose detailed metrics without proper authentication in production', async () => {
      // Arrange
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true })
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ result: 1 }])

      // Act - detailed=true but no internal header in production
      const response = await GET(createMockRequest('http://localhost:3000/api/health?detailed=true'))
      const data = await response.json()

      // Assert - should only get basic info
      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data).not.toHaveProperty('checks')
      expect(data).not.toHaveProperty('uptime')
      expect(data).not.toHaveProperty('version')

      // Restore
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
    })
  })
})
