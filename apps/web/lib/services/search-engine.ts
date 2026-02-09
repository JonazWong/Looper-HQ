/**
 * Search Engine Service
 * Provides full-text search, semantic search, and hybrid search capabilities
 * for PublicCase records using PostgreSQL FTS and AI embeddings
 */

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface SearchOptions {
  query: string;
  source?: string;
  category?: string;
  court?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  searchMode?: 'fulltext' | 'semantic' | 'hybrid';
}

export interface SearchResult {
  cases: any[];
  total: number;
  took: number; // Search time in milliseconds
  suggestions?: string[];
}

/**
 * Full-text search using PostgreSQL FTS
 * Supports Chinese and English text with ranking
 */
export async function fulltextSearch(options: SearchOptions): Promise<SearchResult> {
  const startTime = Date.now();
  const { query, source, category, court, dateFrom, dateTo, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  // Build WHERE conditions for filters
  const filterConditions: string[] = [];
  const filterParams: any[] = [];
  let paramIndex = 2; // Start at 2 because $1 is the search query
  
  if (source) {
    filterConditions.push(`source = $${paramIndex}`);
    filterParams.push(source);
    paramIndex++;
  }
  
  if (category) {
    filterConditions.push(`category::text ILIKE $${paramIndex}`);
    filterParams.push(`%${category}%`);
    paramIndex++;
  }
  
  if (court) {
    filterConditions.push(`court ILIKE $${paramIndex}`);
    filterParams.push(`%${court}%`);
    paramIndex++;
  }
  
  if (dateFrom) {
    filterConditions.push(`"crawledAt" >= $${paramIndex}`);
    filterParams.push(dateFrom.toISOString());
    paramIndex++;
  }
  
  if (dateTo) {
    filterConditions.push(`"crawledAt" <= $${paramIndex}`);
    filterParams.push(dateTo.toISOString());
    paramIndex++;
  }
  
  const whereClause = filterConditions.length > 0 
    ? `AND ${filterConditions.join(' AND ')}`
    : '';
  
  // Convert search query to tsquery format (words joined by &)
  const searchQuery = query
    .split(/\s+/)
    .filter(word => word.length > 0)
    .join(' & ');
  
  // Execute full-text search with ranking
  const [cases, countResult] = await Promise.all([
    prisma.$queryRawUnsafe<any[]>(
      `
      SELECT 
        id, source, "externalId", "sourceUrl", "caseNumber",
        title, description, category, court, judge, 
        "judgmentDate", keywords, tags, "crawledAt",
        ts_rank(search_vector, to_tsquery('chinese', $1)) as rank
      FROM "PublicCase"
      WHERE search_vector @@ to_tsquery('chinese', $1)
        ${whereClause}
      ORDER BY rank DESC, "crawledAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      searchQuery,
      ...filterParams,
      limit,
      skip
    ),
    prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `
      SELECT COUNT(*) as count
      FROM "PublicCase"
      WHERE search_vector @@ to_tsquery('chinese', $1)
        ${whereClause}
      `,
      searchQuery,
      ...filterParams
    ),
  ]);
  
  const took = Date.now() - startTime;
  
  return {
    cases,
    total: Number(countResult[0].count),
    took,
  };
}

/**
 * Semantic search using keyword matching
 * TODO: Implement vector search with pgvector extension for true semantic search
 */
export async function semanticSearch(options: SearchOptions): Promise<SearchResult> {
  const startTime = Date.now();
  const { query, source, category, court, dateFrom, dateTo, limit = 20 } = options;
  
  // Extract keywords from query
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 1);
  
  // Build WHERE clause
  const where: any = {};
  
  if (source) where.source = source;
  if (category) where.category = { equals: category as any };
  if (court) where.court = { contains: court, mode: 'insensitive' };
  
  if (dateFrom || dateTo) {
    where.crawledAt = {};
    if (dateFrom) where.crawledAt.gte = dateFrom;
    if (dateTo) where.crawledAt.lte = dateTo;
  }
  
  // Add keyword matching
  if (keywords.length > 0) {
    where.OR = keywords.flatMap(keyword => [
      { title: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
      { keywords: { has: keyword } },
    ]);
  }
  
  const cases = await prisma.publicCase.findMany({
    where,
    take: limit,
    orderBy: { crawledAt: 'desc' },
  });
  
  const took = Date.now() - startTime;
  
  return {
    cases,
    total: cases.length,
    took,
  };
}

/**
 * Hybrid search combining full-text and semantic search
 * Merges results from both approaches and removes duplicates
 */
export async function hybridSearch(options: SearchOptions): Promise<SearchResult> {
  const startTime = Date.now();
  
  // Execute both searches in parallel
  const [fulltextResults, semanticResults] = await Promise.all([
    fulltextSearch({ ...options, limit: 15 }),
    semanticSearch({ ...options, limit: 10 }),
  ]);
  
  // Merge results and deduplicate by ID
  const seenIds = new Set<string>();
  const mergedCases = [];
  
  for (const case_ of [...fulltextResults.cases, ...semanticResults.cases]) {
    if (!seenIds.has(case_.id)) {
      seenIds.add(case_.id);
      mergedCases.push(case_);
    }
  }
  
  const took = Date.now() - startTime;
  
  return {
    cases: mergedCases.slice(0, options.limit || 20),
    total: fulltextResults.total + semanticResults.total,
    took,
  };
}

/**
 * Unified search entry point
 * Routes to the appropriate search method based on searchMode
 */
export async function search(options: SearchOptions): Promise<SearchResult> {
  const mode = options.searchMode || 'fulltext';
  
  switch (mode) {
    case 'semantic':
      return semanticSearch(options);
    case 'hybrid':
      return hybridSearch(options);
    case 'fulltext':
    default:
      return fulltextSearch(options);
  }
}

/**
 * Get search suggestions for autocomplete
 * Returns matching titles based on partial query
 */
export async function searchSuggestions(query: string, limit = 5): Promise<string[]> {
  if (query.length < 2) return [];
  
  const results = await prisma.$queryRawUnsafe<Array<{ title: string }>>(
    `
    SELECT DISTINCT title
    FROM "PublicCase"
    WHERE title ILIKE $1
    ORDER BY "crawledAt" DESC
    LIMIT $2
    `,
    `%${query}%`,
    limit
  );
  
  return results.map(r => r.title);
}

/**
 * Get trending search keywords
 * Returns most popular searches from the last 7 days
 */
export async function getTrendingSearches(limit = 10): Promise<Array<{ query: string; count: number }>> {
  const trending = await prisma.searchHistory.groupBy({
    by: ['query'],
    _count: {
      query: true,
    },
    orderBy: {
      _count: {
        query: 'desc',
      },
    },
    take: limit,
    where: {
      searchedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
  });
  
  return trending.map(t => ({
    query: t.query,
    count: t._count.query,
  }));
}
