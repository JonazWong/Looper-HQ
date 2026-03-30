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
import { GET, POST } from '@/app/api/time-logs/route'
import {
  createMockRequest,
  parseResponse,
  createMockTimeLog,
  createMockCase,
  createMockClient,
} from '@/__tests__/__mocks__/test-helpers'

describe('GET /api/time-logs', () => {
  beforeEach(() => {
    resetMockPrisma()
    vi.clearAllMocks()
  })

  it('should return list of time logs with statistics', async () => {
    // Arrange
    const mockTimeLogs = [
      createMockTimeLog({
        id: 'log-1',
        description: 'Legal research',
        hours: 3,
        billable: true,
        case: {
          id: 'case-1',
          caseNumber: 'HK-2024-001',
          title: 'Case 1',
          client: { id: 'client-1', name: 'Client 1' },
        },
      }),
      createMockTimeLog({
        id: 'log-2',
        description: 'Court preparation',
        hours: 2,
        billable: true,
        case: {
          id: 'case-2',
          caseNumber: 'HK-2024-002',
          title: 'Case 2',
          client: { id: 'client-2', name: 'Client 2' },
        },
      }),
    ]

    mockPrismaClient.timeLog.count.mockResolvedValue(2)
    mockPrismaClient.timeLog.findMany.mockResolvedValue(mockTimeLogs)
    mockPrismaClient.timeLog.aggregate.mockResolvedValueOnce({
      _sum: { hours: 5 },
      _count: { id: 2 },
    })
    mockPrismaClient.timeLog.aggregate.mockResolvedValueOnce({
      _sum: { hours: 5 },
    })

    const request = createMockRequest('GET', 'http://localhost:3000/api/time-logs', {
      searchParams: { page: '1', perPage: '20' },
    })

    // Act
    const response = await GET(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.timeLogs).toHaveLength(2)
    expect(data.data.statistics).toEqual({
      totalHours: 5,
      totalLogs: 2,
      billableHours: 5,
      nonBillableHours: 0,
    })
    expect(data.meta).toEqual({
      page: 1,
      perPage: 20,
      total: 2,
      totalPages: 1,
    })
  })

  it('should filter time logs by caseId', async () => {
    // Arrange
    mockPrismaClient.timeLog.count.mockResolvedValue(1)
    mockPrismaClient.timeLog.findMany.mockResolvedValue([createMockTimeLog()])
    mockPrismaClient.timeLog.aggregate.mockResolvedValue({
      _sum: { hours: 2.5 },
      _count: { id: 1 },
    })

    const request = createMockRequest('GET', 'http://localhost:3000/api/time-logs', {
      searchParams: { caseId: 'case-123' },
    })

    // Act
    const response = await GET(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockPrismaClient.timeLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ caseId: 'case-123' }),
      })
    )
  })

  it('should filter time logs by billable status', async () => {
    // Arrange
    mockPrismaClient.timeLog.count.mockResolvedValue(1)
    mockPrismaClient.timeLog.findMany.mockResolvedValue([
      createMockTimeLog({ billable: true }),
    ])
    mockPrismaClient.timeLog.aggregate.mockResolvedValue({
      _sum: { hours: 2.5 },
      _count: { id: 1 },
    })

    const request = createMockRequest('GET', 'http://localhost:3000/api/time-logs', {
      searchParams: { billable: 'true' },
    })

    // Act
    const response = await GET(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockPrismaClient.timeLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ billable: true }),
      })
    )
  })

  it('should filter time logs by date range', async () => {
    // Arrange
    mockPrismaClient.timeLog.count.mockResolvedValue(0)
    mockPrismaClient.timeLog.findMany.mockResolvedValue([])
    mockPrismaClient.timeLog.aggregate.mockResolvedValue({
      _sum: { hours: 0 },
      _count: { id: 0 },
    })

    const request = createMockRequest('GET', 'http://localhost:3000/api/time-logs', {
      searchParams: {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
      },
    })

    // Act
    const response = await GET(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockPrismaClient.timeLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          logDate: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    )
  })

  it('should calculate billable vs non-billable statistics', async () => {
    // Arrange
    mockPrismaClient.timeLog.count.mockResolvedValue(3)
    mockPrismaClient.timeLog.findMany.mockResolvedValue([])
    mockPrismaClient.timeLog.aggregate
      .mockResolvedValueOnce({
        _sum: { hours: 10 },
        _count: { id: 3 },
      })
      .mockResolvedValueOnce({
        _sum: { hours: 7 },
      })

    const request = createMockRequest('GET', 'http://localhost:3000/api/time-logs')

    // Act
    const response = await GET(request)
    const data = await parseResponse(response)

    // Assert
    expect(data.data.statistics).toEqual({
      totalHours: 10,
      totalLogs: 3,
      billableHours: 7,
      nonBillableHours: 3,
    })
  })
})

describe('POST /api/time-logs', () => {
  beforeEach(() => {
    resetMockPrisma()
    vi.clearAllMocks()
  })

  it('should create a new time log', async () => {
    // Arrange
    const newTimeLogData = {
      caseId: 'case-123',
      description: 'Legal research on contract law',
      hours: 3.5,
      hourlyRate: 2000,
      billable: true,
      logDate: '2024-01-15T10:00:00.000Z',
    }

    const createdTimeLog = createMockTimeLog({
      ...newTimeLogData,
      case: {
        id: 'case-123',
        caseNumber: 'HK-2024-001',
        title: 'Test Case',
        client: { id: 'client-1', name: 'Test Client' },
      },
    })

    mockPrismaClient.timeLog.create.mockResolvedValue(createdTimeLog)
    mockPrismaClient.activity.create.mockResolvedValue({} as any)

    const request = createMockRequest('POST', 'http://localhost:3000/api/time-logs', {
      body: newTimeLogData,
    })

    // Act
    const response = await POST(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.description).toBe('Legal research on contract law')
    expect(data.data.hours).toBe(3.5)
    expect(mockPrismaClient.timeLog.create).toHaveBeenCalled()
    expect(mockPrismaClient.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: mockSession.user.id,
          activityType: 'CASE_UPDATED',
          description: expect.stringContaining('3.5 hours'),
        }),
      })
    )
  })

  it('should create non-billable time log', async () => {
    // Arrange
    const newTimeLogData = {
      caseId: 'case-123',
      description: 'Internal meeting',
      hours: 1,
      billable: false,
      logDate: '2024-01-15T10:00:00.000Z',
    }

    mockPrismaClient.timeLog.create.mockResolvedValue(createMockTimeLog(newTimeLogData))
    mockPrismaClient.activity.create.mockResolvedValue({} as any)

    const request = createMockRequest('POST', 'http://localhost:3000/api/time-logs', {
      body: newTimeLogData,
    })

    // Act
    const response = await POST(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(200)
    expect(data.data.billable).toBe(false)
  })

  it('should return validation error for missing description', async () => {
    // Arrange
    const request = createMockRequest('POST', 'http://localhost:3000/api/time-logs', {
      body: {
        caseId: 'case-123',
        hours: 2,
        logDate: '2024-01-15T10:00:00.000Z',
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

  it('should return validation error for invalid hours', async () => {
    // Arrange
    const request = createMockRequest('POST', 'http://localhost:3000/api/time-logs', {
      body: {
        caseId: 'case-123',
        description: 'Work done',
        hours: -1, // Invalid negative hours
        logDate: '2024-01-15T10:00:00.000Z',
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
