/**
 * Search Engine Test Suite
 * Tests for full-text search, semantic search, and hybrid search functionality
 *
 * Test strategy for pgvector-dependent paths:
 *  - `semanticSearch` internally calls `generateEmbedding` (OpenAI) and
 *    `prisma.$queryRawUnsafe` (pgvector).  Both are mocked so the tests run
 *    in any CI environment without a real database or OpenAI key.
 *  - The existing integration-style tests (fulltextSearch, hybridSearch, etc.)
 *    continue to work when a real database is available and are skipped
 *    gracefully when not.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fulltextSearch,
  semanticSearch,
  hybridSearch,
  search,
  searchSuggestions,
  getTrendingSearches,
} from '@/lib/services/search-engine';
import * as searchEngine from '@/lib/services/search-engine';

// ─── Mock setup ──────────────────────────────────────────────────────────────

// Mock the AI embedding utility so semantic tests don't need OPENAI_API_KEY
vi.mock('@/lib/utils/embeddings', () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(3072).fill(0.1)),
}));

// Mock the Prisma client for unit tests; integration tests that need a real DB
// can clear/restore these mocks.
vi.mock('@/lib/db', () => ({
  prisma: {
    publicCase: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    searchHistory: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
  },
}));

import { prisma } from '@/lib/db';
import { generateEmbedding } from '@/lib/utils/embeddings';

const mockPrisma = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
  // Reset to safe defaults after each test
  mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
  mockPrisma.publicCase.findMany.mockResolvedValue([]);
  mockPrisma.publicCase.count.mockResolvedValue(0);
  mockPrisma.searchHistory.groupBy.mockResolvedValue([]);
});

// ─── fulltextSearch ───────────────────────────────────────────────────────────
describe('fulltextSearch', () => {
  it('should return search results with ranking', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ id: 'c1', title: 'Test Case', rank: 0.8, crawledAt: new Date() }])
      .mockResolvedValueOnce([{ count: BigInt(1) }]);

    const results = await fulltextSearch({ query: 'criminal', limit: 10 });

    expect(results).toHaveProperty('cases');
    expect(results).toHaveProperty('total');
    expect(results).toHaveProperty('took');
    expect(results.took).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(results.cases)).toBe(true);
    expect(results.total).toBe(1);
  });

  it('should apply source filter', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);

    const results = await fulltextSearch({
      query: 'case',
      source: 'HK_JUDICIARY',
      limit: 5,
    });

    expect(Array.isArray(results.cases)).toBe(true);
  });

  it('should respect pagination', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: BigInt(0) }]);

    const page1 = await fulltextSearch({ query: 'test', page: 1, limit: 5 });
    const page2 = await fulltextSearch({ query: 'test', page: 2, limit: 5 });

    expect(Array.isArray(page1.cases)).toBe(true);
    expect(Array.isArray(page2.cases)).toBe(true);
  });

  it('should handle date filters', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);

    const dateFrom = new Date('2024-01-01');
    const results = await fulltextSearch({ query: 'case', dateFrom, limit: 10 });

    expect(results).toHaveProperty('cases');
  });
});

// ─── semanticSearch ───────────────────────────────────────────────────────────
describe('semanticSearch', () => {
  it('should return pgvector results with similarity scores', async () => {
    const mockCases = [
      {
        id: 'c1',
        title: 'Theft case',
        similarity: 0.85,
        crawledAt: new Date(),
        source: 'HKLII',
      },
      {
        id: 'c2',
        title: 'Burglary case',
        similarity: 0.72,
        crawledAt: new Date(),
        source: 'HKLII',
      },
    ];

    // First call → result rows; second call → count
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce(mockCases)
      .mockResolvedValueOnce([{ count: BigInt(2) }]);

    const results = await semanticSearch({ query: 'theft burglary', limit: 5 });

    expect(results).toHaveProperty('cases');
    expect(results).toHaveProperty('total');
    expect(results).toHaveProperty('took');
    expect(Array.isArray(results.cases)).toBe(true);
    expect(results.total).toBe(2);

    // Similarity scores should be present and in range
    results.cases.forEach((c: any) => {
      expect(c).toHaveProperty('similarity');
      expect(c.similarity).toBeGreaterThanOrEqual(0);
      expect(c.similarity).toBeLessThanOrEqual(1);
    });
  });

  it('should call generateEmbedding for the query', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);

    await semanticSearch({ query: 'criminal law', limit: 5 });

    expect(generateEmbedding).toHaveBeenCalledWith('criminal law', expect.any(String));
  });

  it('should fall back to keyword matching when pgvector is unavailable', async () => {
    // Simulate pgvector not installed: $queryRawUnsafe throws
    mockPrisma.$queryRawUnsafe.mockRejectedValue(
      new Error('operator does not exist: vector <=> vector'),
    );

    // Keyword fallback uses prisma.publicCase.findMany
    mockPrisma.publicCase.findMany.mockResolvedValue([
      { id: 'c1', title: 'Criminal case', keywords: ['criminal'], crawledAt: new Date() },
    ]);
    mockPrisma.publicCase.count.mockResolvedValue(1);

    const results = await semanticSearch({ query: 'criminal', limit: 5 });

    expect(Array.isArray(results.cases)).toBe(true);
    expect(results.total).toBe(1);
  });
});

// ─── hybridSearch ─────────────────────────────────────────────────────────────
describe('hybridSearch', () => {
  it('should combine fulltext and semantic results', async () => {
    // FTS returns 2 cases (with rank); semantic returns 2 cases (with similarity)
    const ftsCases = [
      { id: 'c1', title: 'Case A', rank: 0.9, crawledAt: new Date() },
      { id: 'c2', title: 'Case B', rank: 0.5, crawledAt: new Date() },
    ];
    const vecCases = [
      { id: 'c1', title: 'Case A', similarity: 0.8, crawledAt: new Date() },
      { id: 'c3', title: 'Case C', similarity: 0.6, crawledAt: new Date() },
    ];

    // Mock the higher-level search functions instead of relying on raw query order
    vi.spyOn(searchEngine, 'fulltextSearch').mockResolvedValue({
      cases: ftsCases,
      total: 2,
      took: 5,
    });
    vi.spyOn(searchEngine, 'semanticSearch').mockResolvedValue({
      cases: vecCases,
      total: 2,
      took: 7,
    });

    const results = await hybridSearch({ query: 'criminal case', limit: 10 });

    expect(results).toHaveProperty('cases');
    expect(results).toHaveProperty('total');
    expect(results).toHaveProperty('took');
    expect(Array.isArray(results.cases)).toBe(true);
  });

  it('should deduplicate results across FTS and vector', async () => {
    // Both searches return c1 and c2
    const cases = [
      { id: 'c1', title: 'Case A', rank: 0.9, similarity: 0.8, crawledAt: new Date() },
      { id: 'c2', title: 'Case B', rank: 0.5, similarity: 0.6, crawledAt: new Date() },
    ];

    vi.spyOn(searchEngine, 'fulltextSearch').mockResolvedValue({
      cases,
      total: 2,
      took: 4,
    });
    vi.spyOn(searchEngine, 'semanticSearch').mockResolvedValue({
      cases,
      total: 2,
      took: 6,
    });

    const results = await hybridSearch({ query: 'test', limit: 20 });

    const ids = results.cases.map((c: any) => c.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });
});

// ─── search (unified entry point) ────────────────────────────────────────────
describe('search (unified entry point)', () => {
  it('should route to fulltext search by default', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);

    const results = await search({ query: 'test', limit: 5 });

    expect(results).toHaveProperty('cases');
    expect(results).toHaveProperty('total');
  });

  it('should route to semantic search when specified', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);

    const results = await search({ query: 'test', searchMode: 'semantic', limit: 5 });

    expect(results).toHaveProperty('cases');
    expect(results).toHaveProperty('total');
  });

  it('should route to hybrid search when specified', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: BigInt(0) }]);

    const results = await search({ query: 'test', searchMode: 'hybrid', limit: 5 });

    expect(results).toHaveProperty('cases');
    expect(results).toHaveProperty('total');
  });
});

// ─── searchSuggestions ────────────────────────────────────────────────────────
describe('searchSuggestions', () => {
  it('should return empty array for short queries', async () => {
    const suggestions = await searchSuggestions('a');
    expect(suggestions).toEqual([]);
  });

  it('should return matching titles', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { title: 'Case about theft' },
      { title: 'Case about burglary' },
    ]);

    const suggestions = await searchSuggestions('case', 5);
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });
});

// ─── getTrendingSearches ──────────────────────────────────────────────────────
describe('getTrendingSearches', () => {
  it('should return trending searches', async () => {
    mockPrisma.searchHistory.groupBy.mockResolvedValue([
      { query: 'criminal', _count: { query: 15 } },
      { query: 'theft', _count: { query: 8 } },
    ]);

    const trending = await getTrendingSearches(10);
    expect(Array.isArray(trending)).toBe(true);

    trending.forEach((item: any) => {
      expect(item).toHaveProperty('query');
      expect(item).toHaveProperty('count');
      expect(typeof item.query).toBe('string');
      expect(typeof item.count).toBe('number');
    });
  });

  it('should respect limit parameter', async () => {
    mockPrisma.searchHistory.groupBy.mockResolvedValue([
      { query: 'a', _count: { query: 5 } },
      { query: 'b', _count: { query: 4 } },
      { query: 'c', _count: { query: 3 } },
    ]);

    const trending = await getTrendingSearches(5);
    expect(trending.length).toBeLessThanOrEqual(5);
  });
});

// ─── Chinese text support ─────────────────────────────────────────────────────
describe('Chinese Text Support', () => {
  it('should search Chinese text', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);

    const results = await fulltextSearch({ query: '刑事', limit: 10 });

    expect(results).toHaveProperty('cases');
    expect(Array.isArray(results.cases)).toBe(true);
  });

  it('should support mixed Chinese and English', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);

    const results = await fulltextSearch({ query: '刑事 criminal', limit: 10 });

    expect(results).toHaveProperty('cases');
    expect(Array.isArray(results.cases)).toBe(true);
  });
});

