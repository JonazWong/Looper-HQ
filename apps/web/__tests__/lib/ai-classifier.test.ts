import { describe, it, expect, beforeEach, vi } from 'vitest'
import { classifyCase, ClassificationResult } from '@/lib/services/ai-classifier'
import { CaseCategory } from '@looper-hq/database'

// Mock OpenAI — use a regular function (not an arrow function) so that vitest can
// call it as a constructor (`new OpenAI(...)`).  Arrow functions throw
// "is not a constructor" when invoked with `new`.
const mockCreate = vi.fn()
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }
  }),
}))

describe('AI Classifier Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set default environment variables
    process.env.OPENAI_API_KEY = 'test-api-key'
    process.env.OPENAI_MODEL = 'gpt-4o-mini'
  })

  it('should classify a case with correct category', async () => {
    // Arrange
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: 'CIVIL',
              court: '香港高等法院',
              judge: '張法官',
              parties: ['原告 A', '被告 B'],
              judgmentDate: '2024-01-15',
              summary: '這是一個民事訴訟案件',
              confidence: 0.95,
              keywords: ['民事', '訴訟', '合同糾紛'],
            }),
          },
        },
      ],
    }
    mockCreate.mockResolvedValue(mockResponse)

    // Act
    const result = await classifyCase('民事訴訟案例', '這是關於合同糾紛的案例內容...')

    // Assert
    expect(result).toBeDefined()
    expect(result.category).toBe('CIVIL')
    expect(result.court).toBe('香港高等法院')
    expect(result.judge).toBe('張法官')
    expect(result.parties).toEqual(['原告 A', '被告 B'])
    expect(result.judgmentDate).toBeInstanceOf(Date)
    expect(result.summary).toBe('這是一個民事訴訟案件')
    expect(result.confidence).toBe(0.95)
    expect(result.keywords).toContain('民事')
  })

  it('should handle markdown code blocks in response', async () => {
    // Arrange
    const mockResponse = {
      choices: [
        {
          message: {
            content: '```json\n' + JSON.stringify({
              category: 'CRIMINAL',
              court: '區域法院',
              judge: '李法官',
              parties: ['控方', '被告人'],
              judgmentDate: '2024-02-01',
              summary: '刑事案件審判',
              confidence: 0.88,
              keywords: ['刑事', '盜竊'],
            }) + '\n```',
          },
        },
      ],
    }
    mockCreate.mockResolvedValue(mockResponse)

    // Act
    const result = await classifyCase('刑事案件', '涉及盜竊罪的案例...')

    // Assert
    expect(result.category).toBe('CRIMINAL')
    expect(result.confidence).toBe(0.88)
  })

  it('should support OpenRouter with custom headers', async () => {
    // Arrange
    process.env.OPENAI_BASE_URL = 'https://openrouter.ai/api/v1'
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: 'PROPERTY',
              court: '土地審裁處',
              judge: '王法官',
              parties: ['業主', '租客'],
              judgmentDate: '2024-03-10',
              summary: '物業租賃糾紛',
              confidence: 0.92,
              keywords: ['物業', '租賃'],
            }),
          },
        },
      ],
    }
    mockCreate.mockResolvedValue(mockResponse)

    // Act
    await classifyCase('物業糾紛', '關於租賃合同的爭議...')

    // Assert
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        temperature: 0.3,
        max_tokens: 1000,
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'HTTP-Referer': 'https://looper-hq.app',
          'X-Title': 'Looper HQ',
        }),
      })
    )
  })

  it('should handle missing optional fields', async () => {
    // Arrange
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: 'FAMILY',
              summary: '家事案件',
              confidence: 0.75,
            }),
          },
        },
      ],
    }
    mockCreate.mockResolvedValue(mockResponse)

    // Act
    const result = await classifyCase('家事法案例', '離婚訴訟...')

    // Assert
    expect(result.category).toBe('FAMILY')
    expect(result.court).toBeNull()
    expect(result.judge).toBeNull()
    expect(result.parties).toEqual([])
    expect(result.judgmentDate).toBeNull()
    expect(result.keywords).toEqual([])
    expect(result.confidence).toBe(0.75)
  })

  it('should limit content to 2000 characters', async () => {
    // Arrange
    const LONG_CONTENT = 'A'.repeat(3000);
    const EXPECTED_TRUNCATED = 'A'.repeat(2000);
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: 'EMPLOYMENT',
              summary: '勞工案件',
              confidence: 0.80,
            }),
          },
        },
      ],
    }
    mockCreate.mockResolvedValue(mockResponse)

    // Act
    await classifyCase('勞工糾紛', LONG_CONTENT)

    // Assert - Check that the prompt contains truncated content
    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages.find((m: any) => m.role === 'user')
    expect(userMessage.content).toContain(EXPECTED_TRUNCATED.substring(0, 100))
    expect(userMessage.content).not.toContain('A'.repeat(2001))
  })

  it('should use default confidence when not provided', async () => {
    // Arrange
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: 'CORPORATE',
              summary: '公司法案件',
            }),
          },
        },
      ],
    }
    mockCreate.mockResolvedValue(mockResponse)

    // Act
    const result = await classifyCase('公司訴訟', '股東糾紛...')

    // Assert
    expect(result.confidence).toBe(0.5)
  })
})
