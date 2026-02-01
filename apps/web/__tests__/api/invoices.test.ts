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
import { GET, POST } from '@/app/api/invoices/route'
import {
  createMockRequest,
  parseResponse,
  createMockInvoice,
  createMockCase,
  createMockClient,
} from '@/__tests__/__mocks__/test-helpers'

describe('GET /api/invoices', () => {
  beforeEach(() => {
    resetMockPrisma()
    vi.clearAllMocks()
  })

  it('should return list of invoices with pagination', async () => {
    // Arrange
    const mockInvoices = [
      createMockInvoice({
        id: 'inv-1',
        invoiceNumber: 'INV-20240101-001',
        case: {
          id: 'case-1',
          caseNumber: 'HK-2024-001',
          title: 'Case 1',
          client: createMockClient(),
        },
      }),
      createMockInvoice({
        id: 'inv-2',
        invoiceNumber: 'INV-20240101-002',
        case: {
          id: 'case-2',
          caseNumber: 'HK-2024-002',
          title: 'Case 2',
          client: createMockClient({ id: 'client-2' }),
        },
      }),
    ]

    mockPrismaClient.invoice.count.mockResolvedValue(2)
    mockPrismaClient.invoice.findMany.mockResolvedValue(mockInvoices)

    const request = createMockRequest('GET', 'http://localhost:3000/api/invoices', {
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
  })

  it('should filter invoices by status', async () => {
    // Arrange
    mockPrismaClient.invoice.count.mockResolvedValue(1)
    mockPrismaClient.invoice.findMany.mockResolvedValue([
      createMockInvoice({ status: 'PAID' }),
    ])

    const request = createMockRequest('GET', 'http://localhost:3000/api/invoices', {
      searchParams: { status: 'PAID' },
    })

    // Act
    const response = await GET(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockPrismaClient.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PAID' }),
      })
    )
  })

  it('should filter invoices by caseId', async () => {
    // Arrange
    mockPrismaClient.invoice.count.mockResolvedValue(1)
    mockPrismaClient.invoice.findMany.mockResolvedValue([createMockInvoice()])

    const request = createMockRequest('GET', 'http://localhost:3000/api/invoices', {
      searchParams: { caseId: 'case-123' },
    })

    // Act
    const response = await GET(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockPrismaClient.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ caseId: 'case-123' }),
      })
    )
  })
})

describe('POST /api/invoices', () => {
  beforeEach(() => {
    resetMockPrisma()
    vi.clearAllMocks()
  })

  it('should create a new invoice', async () => {
    // Arrange
    const newInvoiceData = {
      caseId: 'case-123',
      amount: 10000,
      currency: 'HKD',
      status: 'PENDING',
      dueDate: '2024-02-01T00:00:00.000Z',
    }

    const createdInvoice = createMockInvoice({
      ...newInvoiceData,
      invoiceNumber: 'INV-20240101-001',
      case: {
        id: 'case-123',
        caseNumber: 'HK-2024-001',
        title: 'Test Case',
        client: createMockClient(),
      },
    })

    mockPrismaClient.invoice.findFirst.mockResolvedValue(null)
    mockPrismaClient.invoice.create.mockResolvedValue(createdInvoice)
    mockPrismaClient.activity.create.mockResolvedValue({} as any)

    const request = createMockRequest('POST', 'http://localhost:3000/api/invoices', {
      body: newInvoiceData,
    })

    // Act
    const response = await POST(request)
    const data = await parseResponse(response)

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.invoiceNumber).toMatch(/^INV-\d{8}-\d{3}$/)
    expect(mockPrismaClient.invoice.create).toHaveBeenCalled()
    expect(mockPrismaClient.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: mockSession.user.id,
          type: 'PAYMENT_RECEIVED',
        }),
      })
    )
  })

  it('should generate sequential invoice number for same day', async () => {
    // Arrange
    const lastInvoice = createMockInvoice({
      invoiceNumber: 'INV-20240101-005',
    })

    mockPrismaClient.invoice.findFirst.mockResolvedValue(lastInvoice)
    mockPrismaClient.invoice.create.mockResolvedValue(
      createMockInvoice({ invoiceNumber: 'INV-20240101-006' })
    )
    mockPrismaClient.activity.create.mockResolvedValue({} as any)

    const request = createMockRequest('POST', 'http://localhost:3000/api/invoices', {
      body: {
        caseId: 'case-123',
        amount: 5000,
        dueDate: '2024-02-01T00:00:00.000Z',
      },
    })

    // Act
    const response = await POST(request)

    // Assert
    expect(response.status).toBe(200)
    expect(mockPrismaClient.invoice.findFirst).toHaveBeenCalled()
  })

  it('should return validation error for invalid amount', async () => {
    // Arrange
    const request = createMockRequest('POST', 'http://localhost:3000/api/invoices', {
      body: {
        caseId: 'case-123',
        amount: -100, // Negative amount
        dueDate: '2024-02-01T00:00:00.000Z',
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

  it('should require caseId and dueDate', async () => {
    // Arrange
    const request = createMockRequest('POST', 'http://localhost:3000/api/invoices', {
      body: {
        amount: 1000,
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
