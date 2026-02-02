import { NextRequest } from 'next/server'

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/test',
  options: {
    body?: any
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
): NextRequest {
  const { body, headers = {}, searchParams = {} } = options

  // Build URL with search params
  const urlObj = new URL(url)
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  const requestInit: RequestInit & { signal?: AbortSignal } = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj.toString(), requestInit as RequestInit)
}

/**
 * Parse response JSON
 */
export async function parseResponse<T = any>(response: Response): Promise<T> {
  return await response.json()
}

/**
 * Create test data helpers
 */
export const createMockCase = (overrides = {}) => ({
  id: 'case-123',
  caseNumber: 'HK-2024-001',
  title: 'Test Case',
  description: 'Test case description',
  category: 'CIVIL',
  priority: 'MEDIUM',
  status: 'ACTIVE',
  clientId: 'client-123',
  lawyerId: 'lawyer-123',
  courtDate: null,
  estimatedValue: 100000,
  isPublic: false,
  publicNote: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const createMockClient = (overrides = {}) => ({
  id: 'client-123',
  name: 'Test Client',
  email: 'client@example.com',
  phone: '12345678',
  ...overrides,
})

export const createMockInvoice = (overrides = {}) => ({
  id: 'invoice-123',
  invoiceNumber: 'INV-20240101-001',
  caseId: 'case-123',
  amount: 5000,
  currency: 'HKD',
  status: 'PENDING',
  issueDate: new Date('2024-01-01'),
  dueDate: new Date('2024-02-01'),
  paidDate: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const createMockTimeLog = (overrides = {}) => ({
  id: 'timelog-123',
  caseId: 'case-123',
  description: 'Legal research',
  hours: 2.5,
  hourlyRate: 2000,
  billable: true,
  logDate: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})
