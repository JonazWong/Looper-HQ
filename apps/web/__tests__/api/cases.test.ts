import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockPrismaClient, resetMockPrisma } from '@/__tests__/__mocks__/prisma'
import { mockRequireAuth, mockSession } from '@/__tests__/__mocks__/auth'

// Mock dependencies BEFORE importing the route
vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}))

vi.mock('@/lib/api/auth', () => ({
  requireAuth: mockRequireAuth,
}))

// Import route AFTER mocking
import { GET, POST } from '@/app/api/cases/route'
import {
  createMockRequest,
  parseResponse,
  createMockCase,
  createMockClient,
} from '@/__tests__/__mocks__/test-helpers'

describe('GET /api/cases', () => {
  beforeEach(() => {
    resetMockPrisma()
    vi.clearAllMocks()
  })

  it('should return list of cases with pagination', async () => {
    // Arrange
    const mockCases = [
      createMockCase({
        id: 'case-1',
        title: 'Case 1',
        client: createMockClient({ id: 'client-1' }),
        lawyer: { id: 'lawyer-1', name: 'Lawyer 1', email: 'lawyer1@example.com' },
        _count: { documents: 5, activities: 10, notes: 3 },
      }),
      createMockCase({
        id: 'case-2',
        title: 'Case 2',
        client: createMockClient({ id: 'client-2' }),
        lawyer: { id: 'lawyer-2', name: 'Lawyer 2', email: 'lawyer2@example.com' },
        _count: { documents: 2, activities: 5, notes: 1 },
      }),
    ]

    mockPrismaClient.case.count.mockResolvedValue(2)
    mockPrismaClient.case.findMany.mockResolvedValue(mockCases)

    const request = createMockRequest('GET', 'http://localhost:3000/api/cases', {
      searchParams: { page: '1', perPage: '20' },
    })

    // Act
    const response = await GET(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.meta).toEqual({
      page: 1,
      perPage: 20,
      total: 2,
      totalPages: 1,
    })
    expect(mockPrismaClient.case.findMany).toHaveBeenCalled()
  })

  it('should filter cases by status', async () => {
    // Arrange
    const mockCases = [createMockCase({ status: 'ACTIVE' })]
    mockPrismaClient.case.count.mockResolvedValue(1)
    mockPrismaClient.case.findMany.mockResolvedValue(mockCases)

    const request = createMockRequest('GET', 'http://localhost:3000/api/cases', {
      searchParams: { status: 'ACTIVE' },
    })

    // Act
    const response = await GET(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockPrismaClient.case.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
      })
    )
  })

  it('should filter cases by priority', async () => {
    // Arrange
    mockPrismaClient.case.count.mockResolvedValue(0)
    mockPrismaClient.case.findMany.mockResolvedValue([])

    const request = createMockRequest('GET', 'http://localhost:3000/api/cases', {
      searchParams: { priority: 'HIGH' },
    })

    // Act
    const response = await GET(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockPrismaClient.case.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ priority: 'HIGH' }),
      })
    )
  })

  it('should search cases by text', async () => {
    // Arrange
    mockPrismaClient.case.count.mockResolvedValue(0)
    mockPrismaClient.case.findMany.mockResolvedValue([])

    const request = createMockRequest('GET', 'http://localhost:3000/api/cases', {
      searchParams: { search: 'contract' },
    })

    // Act
    const response = await GET(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockPrismaClient.case.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { caseNumber: { contains: 'contract', mode: 'insensitive' } },
            { title: { contains: 'contract', mode: 'insensitive' } },
            { description: { contains: 'contract', mode: 'insensitive' } },
          ]),
        }),
      })
    )
  })

  it('should return validation error for invalid pagination', async () => {
    // Arrange
    const request = createMockRequest('GET', 'http://localhost:3000/api/cases', {
      searchParams: { page: '-1' },
    })

    // Act
    const response = await GET(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/cases', () => {
  beforeEach(() => {
    resetMockPrisma()
    vi.clearAllMocks()
  })

  it('should create a new case', async () => {
    // Arrange
    const newCaseData = {
      title: 'New Case',
      description: 'New case description',
      category: 'CIVIL',
      priority: 'MEDIUM',
      status: 'ACTIVE',
      clientId: 'client-123',
    }

    const createdCase = createMockCase({
      ...newCaseData,
      caseNumber: 'HK-2024-001',
      client: createMockClient(),
      lawyer: null,
    })

    mockPrismaClient.case.findFirst.mockResolvedValue(null)
    mockPrismaClient.case.create.mockResolvedValue(createdCase)
    mockPrismaClient.activity.create.mockResolvedValue({} as any)

    const request = createMockRequest('POST', 'http://localhost:3000/api/cases', {
      body: newCaseData,
    })

    // Act
    const response = await POST(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.caseNumber).toBe('HK-2024-001')
    expect(mockPrismaClient.case.create).toHaveBeenCalled()
    expect(mockPrismaClient.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: mockSession.user.id,
          type: 'CASE_CREATED',
        }),
      })
    )
  })

  it('should generate incremental case number', async () => {
    // Arrange
    const lastCase = createMockCase({ caseNumber: 'HK-2024-005' })
    mockPrismaClient.case.findFirst.mockResolvedValue(lastCase)
    mockPrismaClient.case.create.mockResolvedValue(
      createMockCase({ caseNumber: 'HK-2024-006' })
    )
    mockPrismaClient.activity.create.mockResolvedValue({} as any)

    const request = createMockRequest('POST', 'http://localhost:3000/api/cases', {
      body: {
        title: 'Test Case',
        category: 'CIVIL',
        clientId: 'client-123',
      },
    })

    // Act
    const response = await POST(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(200)
    expect(mockPrismaClient.case.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          caseNumber: expect.objectContaining({
            startsWith: expect.stringContaining('HK-2024-'),
          }),
        }),
      })
    )
  })

  it('should return validation error for missing required fields', async () => {
    // Arrange
    const request = createMockRequest('POST', 'http://localhost:3000/api/cases', {
      body: {
        title: 'Te', // Too short
      },
    })

    // Act
    const response = await POST(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('should validate category enum', async () => {
    // Arrange
    const request = createMockRequest('POST', 'http://localhost:3000/api/cases', {
      body: {
        title: 'Valid Title',
        category: 'INVALID_CATEGORY',
        clientId: 'client-123',
      },
    })

    // Act
    const response = await POST(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})
