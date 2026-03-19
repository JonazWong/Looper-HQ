/**
 * Tests for Recommendations Service
 * All Prisma calls are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRelatedCases } from '@/lib/services/recommendations'

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    publicCase: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    embedding: {
      findFirst: vi.fn(),
    },
    $queryRawUnsafe: vi.fn(),
  },
}))

import { prisma } from '@/lib/db'

const mockPrisma = prisma as any

const sourceCase = {
  id: 'src-1',
  category: 'CIVIL',
  court: 'Court of First Instance',
  keywords: ['contract', 'breach', 'damages'],
}

const candidate1 = {
  id: 'c1',
  title_zh: '民事案件',
  title_en: 'Civil Case 1',
  caseNumber: 'HCA 1/2024',
  neutralCitation: null,
  court: 'Court of First Instance',
  judge: 'Judge A',
  judgmentDate: new Date('2024-01-01'),
  category: 'CIVIL',
  crawledAt: new Date('2024-06-01'),
  keywords: ['contract', 'breach'],
}

const candidate2 = {
  id: 'c2',
  title_zh: '另一案件',
  title_en: 'Another Case',
  caseNumber: 'HCA 2/2024',
  neutralCitation: null,
  court: 'District Court',
  judge: 'Judge B',
  judgmentDate: new Date('2024-02-01'),
  category: 'CRIMINAL',
  crawledAt: new Date('2024-05-01'),
  keywords: ['theft'],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.publicCase.findUnique.mockResolvedValue(sourceCase)
  mockPrisma.embedding.findFirst.mockResolvedValue(null) // no embedding → skip pgvector
  mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('no pgvector'))
})

describe('getRelatedCases', () => {
  it('should return empty array for unknown case id', async () => {
    mockPrisma.publicCase.findUnique.mockResolvedValue(null)
    const result = await getRelatedCases('unknown-id')
    expect(result).toEqual([])
  })

  it('should return scored related cases', async () => {
    mockPrisma.publicCase.findMany.mockResolvedValue([candidate1, candidate2])

    const result = await getRelatedCases('src-1', 5)

    expect(result).toHaveLength(2)
    // candidate1 shares category + court + 2 keywords → score 4+2 = higher
    // candidate2 shares nothing → score 0
    expect(result[0].id).toBe('c1')
    expect(result[0].score).toBeGreaterThan(result[1].score)
  })

  it('should exclude the source case from results', async () => {
    // findUnique for source returns sourceCase; findMany should not include src-1
    mockPrisma.publicCase.findMany.mockResolvedValue([candidate1])

    const result = await getRelatedCases('src-1')
    const ids = result.map((r) => r.id)
    expect(ids).not.toContain('src-1')
  })

  it('should respect the limit parameter', async () => {
    const manyCandidates = Array.from({ length: 10 }, (_, i) => ({
      ...candidate1,
      id: `c${i}`,
      keywords: [],
    }))
    mockPrisma.publicCase.findMany.mockResolvedValue(manyCandidates)

    const result = await getRelatedCases('src-1', 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('should return recent cases when no category or court available', async () => {
    mockPrisma.publicCase.findUnique.mockResolvedValue({
      id: 'src-bare',
      category: null,
      court: null,
      keywords: [],
    })
    mockPrisma.publicCase.findMany.mockResolvedValue([candidate1])

    const result = await getRelatedCases('src-bare', 5)
    expect(Array.isArray(result)).toBe(true)
  })
})
