import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockRequireAuth, mockSession } from '@/__tests__/__mocks__/auth'
import { createMockRequest } from '@/__tests__/__mocks__/test-helpers'

// Mock the classifier service
const mockClassifyCase = vi.fn()
vi.mock('@/lib/services/ai-classifier', () => ({
  classifyCase: mockClassifyCase,
}))

// Mock auth
vi.mock('@/lib/api/auth', () => ({
  requireAuth: mockRequireAuth,
}))

// Import route AFTER mocking
import { POST } from '@/app/api/classify/route'

describe('POST /api/classify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require authentication', async () => {
    // Arrange
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))
    const request = createMockRequest('POST', 'http://localhost:3000/api/classify', {
      body: { title: 'Test', content: 'Test content' },
    })

    // Act & Assert
    await expect(POST(request)).rejects.toThrow('Unauthorized')
  })

  it('should return 400 if title is missing', async () => {
    // Arrange
    mockRequireAuth.mockResolvedValue(mockSession)
    const request = createMockRequest('POST', 'http://localhost:3000/api/classify', {
      body: { content: 'Test content' },
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Title and content are required')
  })

  it('should return 400 if content is missing', async () => {
    // Arrange
    mockRequireAuth.mockResolvedValue(mockSession)
    const request = createMockRequest('POST', 'http://localhost:3000/api/classify', {
      body: { title: 'Test Case' },
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Title and content are required')
  })

  it('should successfully classify a case', async () => {
    // Arrange
    mockRequireAuth.mockResolvedValue(mockSession)
    const mockResult = {
      category: 'CIVIL',
      court: '香港高等法院',
      judge: '張法官',
      parties: ['原告', '被告'],
      judgmentDate: new Date('2024-01-15'),
      summary: '民事訴訟案件',
      confidence: 0.95,
      keywords: ['民事', '訴訟'],
    }
    mockClassifyCase.mockResolvedValue(mockResult)

    const request = createMockRequest('POST', 'http://localhost:3000/api/classify', {
      body: {
        title: '民事訴訟案例',
        content: '這是關於合同糾紛的案例內容...',
      },
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.category).toBe('CIVIL')
    expect(data.court).toBe('香港高等法院')
    expect(data.confidence).toBe(0.95)
    expect(mockClassifyCase).toHaveBeenCalledWith(
      '民事訴訟案例',
      '這是關於合同糾紛的案例內容...'
    )
  })

  it('should handle classification errors', async () => {
    // Arrange
    mockRequireAuth.mockResolvedValue(mockSession)
    mockClassifyCase.mockRejectedValue(new Error('OpenAI API error'))

    const request = createMockRequest('POST', 'http://localhost:3000/api/classify', {
      body: {
        title: 'Test Case',
        content: 'Test content',
      },
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data.error).toBe('Classification failed')
    expect(data.details).toBe('OpenAI API error')
  })

  it('should handle empty string title as missing', async () => {
    // Arrange
    mockRequireAuth.mockResolvedValue(mockSession)
    const request = createMockRequest('POST', 'http://localhost:3000/api/classify', {
      body: { title: '', content: 'Test content' },
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Title and content are required')
  })

  it('should handle empty string content as missing', async () => {
    // Arrange
    mockRequireAuth.mockResolvedValue(mockSession)
    const request = createMockRequest('POST', 'http://localhost:3000/api/classify', {
      body: { title: 'Test Case', content: '' },
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Title and content are required')
  })
})
