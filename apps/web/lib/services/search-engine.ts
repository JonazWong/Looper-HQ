/**
 * Search Engine Service
 * Provides full-text search, semantic search, and hybrid search capabilities
 * for PublicCase records using PostgreSQL FTS and AI embeddings
 */

import { prisma } from '@/lib/db';
import { generateEmbedding } from '@/lib/utils/embeddings';
import { CaseSource } from '@looper-hq/database';

export interface SearchOptions {
  query: string;
  source?: string;
  category?: string;
  court?: string;
  judge?: string;
  year?: number;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  searchMode?: 'fulltext' | 'semantic' | 'hybrid';
  /** When true, ts_headline snippets are appended as `highlight_*` fields on each result */
  highlight?: boolean;
}

export interface SearchResult {
  cases: any[];
  total: number;
  took: number; // Search time in milliseconds
  suggestions?: string[];
}

/** Shape of a row returned by the pgvector semantic query. */
interface SemanticCaseRow {
  id: string;
  source: string;
  externalId: string;
  sourceUrl: string | null;
  caseNumber: string | null;
  title: string;
  description: string | null;
  category: string | null;
  court: string | null;
  judge: string | null;
  judgmentDate: Date | null;
  keywords: string[];
  tags: string[];
  crawledAt: Date;
  /** Cosine similarity in [-1, 1]; higher = more similar. */
  similarity: number;
}

/**
 * Full-text search using PostgreSQL FTS
 * Supports Chinese and English text with ranking
 */
export async function fulltextSearch(options: SearchOptions): Promise<SearchResult> {
  const startTime = Date.now();
  const { query, source, category, court, judge, year, dateFrom, dateTo, page = 1, limit = 20, highlight = false } = options;
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

  if (judge) {
    filterConditions.push(`judge ILIKE $${paramIndex}`);
    filterParams.push(`%${judge}%`);
    paramIndex++;
  }

  if (year) {
    filterConditions.push(`EXTRACT(YEAR FROM "judgmentDate") = $${paramIndex}`);
    filterParams.push(year);
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

  // ts_headline options for highlighted snippets
  const hlOptions = `'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=false, MaxFragments=2, FragmentDelimiter=" … "'`;

  const highlightCols = highlight
    ? `ts_headline('chinese', COALESCE(title, ''), plainto_tsquery('chinese', $1), ${hlOptions}) AS highlight_title,
        ts_headline('chinese', COALESCE(description, ''), plainto_tsquery('chinese', $1), ${hlOptions}) AS highlight_description,`
    : '';
  
  // Use plainto_tsquery for safe handling of user input (no syntax errors)
  // Execute full-text search with ranking; also search fullText/judgment_en on-the-fly.
  // NOTE: on-the-fly to_tsvector over large text columns is intentionally a fallback path
  // for cases without a pre-computed search_vector. Once search_vector is kept up to date
  // (e.g. via a trigger that includes those columns), the OR branches will rarely be hit.
  const [cases, countResult] = await Promise.all([
    prisma.$queryRawUnsafe<any[]>(
      `
      SELECT 
        id, source, "externalId", "sourceUrl", "caseNumber",
        title, description, category, court, judge, 
        "judgmentDate", keywords, tags, "crawledAt",
        ${highlightCols}
        GREATEST(
          COALESCE(ts_rank(search_vector, plainto_tsquery('chinese', $1)), 0),
          CASE 
            WHEN search_vector IS NULL 
              THEN ts_rank(to_tsvector('english', COALESCE("fullText", '')), plainto_tsquery('english', $1)) 
            ELSE 0 
          END,
          CASE 
            WHEN search_vector IS NULL 
              THEN ts_rank(to_tsvector('english', COALESCE("judgment_en", '')), plainto_tsquery('english', $1)) 
            ELSE 0 
          END,
          CASE
            WHEN search_vector IS NULL
              THEN ts_rank(to_tsvector('chinese', COALESCE("judgment_zh", '')), plainto_tsquery('chinese', $1))
            ELSE 0
          END
        ) as rank
      FROM "public_cases"
      WHERE (
        search_vector @@ plainto_tsquery('chinese', $1)
        OR (
          search_vector IS NULL AND (
            to_tsvector('english', COALESCE("fullText", '')) @@ plainto_tsquery('english', $1)
            OR to_tsvector('english', COALESCE("judgment_en", '')) @@ plainto_tsquery('english', $1)
            OR to_tsvector('chinese', COALESCE("judgment_zh", '')) @@ plainto_tsquery('chinese', $1)
          )
        )
      )
        ${whereClause}
      ORDER BY rank DESC, "crawledAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      query,
      ...filterParams,
      limit,
      skip
    ),
    prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `
      SELECT COUNT(*) as count
      FROM "public_cases"
      WHERE (
        search_vector @@ plainto_tsquery('chinese', $1)
        OR (
          search_vector IS NULL AND (
            to_tsvector('english', COALESCE("fullText", '')) @@ plainto_tsquery('english', $1)
            OR to_tsvector('english', COALESCE("judgment_en", '')) @@ plainto_tsquery('english', $1)
            OR to_tsvector('chinese', COALESCE("judgment_zh", '')) @@ plainto_tsquery('chinese', $1)
          )
        )
      )
        ${whereClause}
      `,
      query,
      ...filterParams
    ),
  ]);
  
  const took = Date.now() - startTime;
  
  return {
    cases,
    total: countResult?.[0]?.count ? Number(countResult[0].count) : 0,
    took,
  };
}

/**
 * Semantic search using pgvector cosine similarity.
 *
 * Strategy:
 *  1. Generate an embedding for the user query (text-embedding-3-large, dim=3072).
 *  2. Ask PostgreSQL to rank stored embeddings by cosine distance using the <=> operator
 *     and the HNSW index created by add_pgvector_search.sql.
 *  3. Return each case with a `similarity` field (0–1, higher is better) so callers
 *     can surface relevance to users.
 *
 * Fallback:
 *  If pgvector is unavailable (extension not installed, column NULL, or query error),
 *  the function falls back to keyword matching so the API never returns a hard error.
 */
export async function semanticSearch(options: SearchOptions): Promise<SearchResult> {
  const startTime = Date.now();
  const { query, source, category, court, judge, year, dateFrom, dateTo, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // ── pgvector path ────────────────────────────────────────────────────────────
  try {
    // 1. Embed the query
    const queryVector = await generateEmbedding(
      query,
      process.env.EMBEDDING_MODEL || 'text-embedding-3-large',
    );
    const vectorLiteral = `[${queryVector.join(',')}]`;

    // 2. Build optional filter clauses
    const filterConditions: string[] = [`e."sourceField" = 'content'`, `e."embedding_vector_v" IS NOT NULL`];
    const filterParams: any[] = [vectorLiteral];
    let paramIndex = 2;

    if (source && Object.values(CaseSource).includes(source as CaseSource)) {
      filterConditions.push(`pc.source = $${paramIndex}`);
      filterParams.push(source as CaseSource);
      paramIndex++;
    }

    if (category) {
      filterConditions.push(`pc.category::text ILIKE $${paramIndex}`);
      filterParams.push(`%${category}%`);
      paramIndex++;
    }

    if (court) {
      filterConditions.push(`pc.court ILIKE $${paramIndex}`);
      filterParams.push(`%${court}%`);
      paramIndex++;
    }

    if (judge) {
      filterConditions.push(`pc.judge ILIKE $${paramIndex}`);
      filterParams.push(`%${judge}%`);
      paramIndex++;
    }

    if (year) {
      filterConditions.push(`EXTRACT(YEAR FROM pc."judgmentDate") = $${paramIndex}`);
      filterParams.push(year);
      paramIndex++;
    }

    if (dateFrom) {
      filterConditions.push(`pc."crawledAt" >= $${paramIndex}`);
      filterParams.push(dateFrom.toISOString());
      paramIndex++;
    }

    if (dateTo) {
      filterConditions.push(`pc."crawledAt" <= $${paramIndex}`);
      filterParams.push(dateTo.toISOString());
      paramIndex++;
    }

    const whereClause = filterConditions.length > 0
      ? `WHERE ${filterConditions.join(' AND ')}`
      : '';

    // 3. cosine similarity = 1 − cosine distance; filter out very low scores (< 0.3)
    const similarityThreshold = 0.3;

    const cases = await prisma.$queryRawUnsafe<SemanticCaseRow[]>(
      `
      SELECT
        pc.id, pc.source, pc."externalId", pc."sourceUrl", pc."caseNumber",
        COALESCE(pc."title_en", pc."title_zh") AS title,
        COALESCE(pc."description_en", pc."description_zh") AS description,
        pc.category, pc.court, pc.judge,
        pc."judgmentDate", pc.keywords, pc.tags, pc."crawledAt",
        (1 - (e."embedding_vector_v" <=> $1::vector))::float AS similarity
      FROM "embeddings" e
      JOIN "public_cases" pc ON pc.id = e."publicCaseId"
      ${whereClause}
        AND (1 - (e."embedding_vector_v" <=> $1::vector)) >= ${similarityThreshold}
      ORDER BY e."embedding_vector_v" <=> $1::vector
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
      ...filterParams,
      limit,
      skip,
    );

    // 4. Count (no-limit version)
    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `
      SELECT COUNT(*) AS count
      FROM "embeddings" e
      JOIN "public_cases" pc ON pc.id = e."publicCaseId"
      ${whereClause}
        AND (1 - (e."embedding_vector_v" <=> $1::vector)) >= ${similarityThreshold}
      `,
      ...filterParams,
    );

    const took = Date.now() - startTime;
    return {
      cases,
      total: Number(countResult[0].count),
      took,
    };
  } catch {
    // ── keyword-matching fallback ────────────────────────────────────────────
    // pgvector may not be installed, or no embeddings exist yet.
  }

  // Fallback: keyword matching (original implementation)
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 1);

  const where: any = {};

  if (source && Object.values(CaseSource).includes(source as CaseSource)) {
    where.source = source as CaseSource;
  }

  if (category) {
    where.category = { contains: category, mode: 'insensitive' };
  }

  if (court) {
    where.court = { contains: court, mode: 'insensitive' };
  }

  if (judge) {
    where.judge = { contains: judge, mode: 'insensitive' };
  }

  if (year) {
    where.judgmentDate = {
      gte: new Date(`${year}-01-01`),
      lte: new Date(`${year}-12-31`),
    };
  }

  if (dateFrom || dateTo) {
    where.crawledAt = {};
    if (dateFrom) where.crawledAt.gte = dateFrom;
    if (dateTo) where.crawledAt.lte = dateTo;
  }

  if (keywords.length > 0) {
    where.OR = keywords.flatMap(keyword => [
      { title: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
      { keywords: { has: keyword } },
    ]);
  }

  const [cases, total] = await Promise.all([
    prisma.publicCase.findMany({
      where,
      skip,
      take: limit,
      orderBy: { crawledAt: 'desc' },
    }),
    prisma.publicCase.count({ where }),
  ]);

  const took = Date.now() - startTime;
  return { cases, total, took };
}

/**
 * Hybrid search combining full-text and semantic (vector) search.
 *
 * Scoring rationale:
 *  - FTS rank (from ts_rank) reflects term-frequency relevance in indexed fields.
 *    We normalise it to [0, 1] by dividing by the maximum rank in the result set.
 *  - Vector similarity (cosine) is already in [0, 1] — 1 means identical vectors.
 *  - Weighted blend:  score = FTS_WEIGHT × normalisedFtsRank + VEC_WEIGHT × similarity
 *    Default weights: FTS 60 %, Vector 40 %.  FTS is weighted higher because:
 *      (a) it captures exact legal terminology reliably, and
 *      (b) many cases may not have embeddings yet (the vector score defaults to 0).
 *  - Results are sorted descending by combined score, then deduped by case ID.
 */
const FTS_WEIGHT = 0.6;
const VEC_WEIGHT = 0.4;

export async function hybridSearch(options: SearchOptions): Promise<SearchResult> {
  const startTime = Date.now();
  const { page = 1, limit = 20 } = options;

  // Fetch a wider candidate set from each sub-search so the weighted merge can
  // produce a full page of results even after deduplication. Scale with `page`
  // so later pages still have enough candidates for in-memory pagination.
  const candidateLimit = limit * 3 * page;

  // Run FTS and vector searches in parallel
  const [fulltextResults, semanticResults] = await Promise.all([
    fulltextSearch({ ...options, page: 1, limit: candidateLimit }),
    semanticSearch({ ...options, page: 1, limit: candidateLimit }),
  ]);

  // ── Normalise FTS ranks ──────────────────────────────────────────────────────
  // ts_rank is already a float but has no fixed upper bound.  Divide by the
  // maximum observed rank so FTS scores land in [0, 1].
  const maxFtsRank = fulltextResults.cases.reduce(
    (max: number, c: any) => Math.max(max, Number(c.rank ?? 0)),
    0,
  );

  // Build a map of id → combined score for deduplication + ranking
  const scoreMap = new Map<string, { case_: any; score: number }>();

  for (const c of fulltextResults.cases) {
    const normRank = maxFtsRank > 0 ? Number(c.rank ?? 0) / maxFtsRank : 0;
    const score = FTS_WEIGHT * normRank;
    scoreMap.set(c.id, { case_: { ...c }, score });
  }

  for (const c of semanticResults.cases) {
    const vecSim = Number(c.similarity ?? 0);
    const existing = scoreMap.get(c.id);
    if (existing) {
      // Case found in both: add weighted vector contribution
      const newScore = existing.score + VEC_WEIGHT * vecSim;
      scoreMap.set(c.id, {
        case_: { ...existing.case_, similarity: vecSim },
        score: newScore,
      });
    } else {
      const score = VEC_WEIGHT * vecSim;
      scoreMap.set(c.id, { case_: { ...c, similarity: vecSim }, score });
    }
  }

  // Sort by combined score descending, then paginate
  const sorted = [...scoreMap.values()]
    .sort((a, b) => b.score - a.score)
    .map(v => v.case_);

  const skip = (page - 1) * limit;
  const pageCases = sorted.slice(skip, skip + limit);

  const took = Date.now() - startTime;

  // Use FTS total as the primary estimate (more accurate for pagination display)
  return {
    cases: pageCases,
    total: fulltextResults.total,
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
 * Returns matching titles based on prefix query
 */
export async function searchSuggestions(query: string, limit = 5): Promise<string[]> {
  if (query.length < 2) return [];
  
  // Use prefix matching for better performance
  const results = await prisma.$queryRawUnsafe<Array<{ title: string }>>(
    `
    SELECT DISTINCT title
    FROM "public_cases"
    WHERE title ILIKE $1
    ORDER BY "crawledAt" DESC
    LIMIT $2
    `,
    `${query}%`,
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

// ─── FacetResult ─────────────────────────────────────────────────────────────

export interface FacetBucket {
  value: string;
  count: number;
}

export interface FacetResult {
  courts: FacetBucket[];
  years: FacetBucket[];
  categories: FacetBucket[];
  judges: FacetBucket[];
}

/**
 * Compute facet counts for the current query + filters.
 *
 * Uses PostgreSQL GROUP BY over the filtered result set so the counts always
 * reflect what the user would see after applying all active filters.
 *
 * @param options  Same options as `search()` (query + filters).
 * @param topN     Max buckets per facet dimension (default 20).
 */
export async function getSearchFacets(
  options: Omit<SearchOptions, 'page' | 'limit' | 'searchMode' | 'highlight'>,
  topN = 20,
): Promise<FacetResult> {
  const { query, source, category, court, judge, year, dateFrom, dateTo } = options;

  // Build a common WHERE clause that covers both FTS match and scalar filters.
  // We include the FTS match only when a query is present.
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (query) {
    conditions.push(
      `(search_vector @@ plainto_tsquery('chinese', $${idx})
        OR (search_vector IS NULL AND (
          to_tsvector('english', COALESCE("fullText", '')) @@ plainto_tsquery('english', $${idx})
          OR to_tsvector('english', COALESCE("judgment_en", '')) @@ plainto_tsquery('english', $${idx})
          OR to_tsvector('chinese', COALESCE("judgment_zh", '')) @@ plainto_tsquery('chinese', $${idx})
        ))
      )`,
    );
    params.push(query);
    idx++;
  }

  if (source) {
    conditions.push(`source = $${idx}`);
    params.push(source);
    idx++;
  }

  if (category) {
    conditions.push(`category::text ILIKE $${idx}`);
    params.push(`%${category}%`);
    idx++;
  }

  if (court) {
    conditions.push(`court ILIKE $${idx}`);
    params.push(`%${court}%`);
    idx++;
  }

  if (judge) {
    conditions.push(`judge ILIKE $${idx}`);
    params.push(`%${judge}%`);
    idx++;
  }

  if (year) {
    conditions.push(`EXTRACT(YEAR FROM "judgmentDate") = $${idx}`);
    params.push(year);
    idx++;
  }

  if (dateFrom) {
    conditions.push(`"crawledAt" >= $${idx}`);
    params.push(dateFrom.toISOString());
    idx++;
  }

  if (dateTo) {
    conditions.push(`"crawledAt" <= $${idx}`);
    params.push(dateTo.toISOString());
    idx++;
  }

  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : 'WHERE 1=1';

  // Run all four GROUP BY queries in parallel
  const [courtRows, yearRows, categoryRows, judgeRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ value: string; count: bigint }>>(
      `SELECT court AS value, COUNT(*) AS count
       FROM "public_cases"
       ${whereSQL}
       AND court IS NOT NULL AND court <> ''
       GROUP BY court
       ORDER BY count DESC
       LIMIT $${idx}`,
      ...params,
      topN,
    ),
    prisma.$queryRawUnsafe<Array<{ value: string; count: bigint }>>(
      `SELECT EXTRACT(YEAR FROM "judgmentDate")::text AS value, COUNT(*) AS count
       FROM "public_cases"
       ${whereSQL}
       AND "judgmentDate" IS NOT NULL
       GROUP BY value
       ORDER BY value DESC
       LIMIT $${idx}`,
      ...params,
      topN,
    ),
    prisma.$queryRawUnsafe<Array<{ value: string; count: bigint }>>(
      `SELECT category::text AS value, COUNT(*) AS count
       FROM "public_cases"
       ${whereSQL}
       AND category IS NOT NULL
       GROUP BY category
       ORDER BY count DESC
       LIMIT $${idx}`,
      ...params,
      topN,
    ),
    prisma.$queryRawUnsafe<Array<{ value: string; count: bigint }>>(
      `SELECT judge AS value, COUNT(*) AS count
       FROM "public_cases"
       ${whereSQL}
       AND judge IS NOT NULL AND judge <> ''
       GROUP BY judge
       ORDER BY count DESC
       LIMIT $${idx}`,
      ...params,
      topN,
    ),
  ]);

  const toFacetBuckets = (rows: Array<{ value: string; count: bigint }>): FacetBucket[] =>
    rows.filter(r => r.value).map(r => ({ value: r.value, count: Number(r.count) }));

  return {
    courts: toFacetBuckets(courtRows),
    years: toFacetBuckets(yearRows),
    categories: toFacetBuckets(categoryRows),
    judges: toFacetBuckets(judgeRows),
  };
}

/**
 * Get typed suggestions for autocomplete.
 *
 * @param query  Prefix typed by the user.
 * @param type   Suggestion type: 'caseNumber' | 'judge' | 'court' | 'general'
 * @param limit  Maximum number of results.
 */
export async function getTypedSuggestions(
  query: string,
  type: 'caseNumber' | 'judge' | 'court' | 'general' = 'general',
  limit = 8,
): Promise<string[]> {
  if (!query || query.length < 1) return [];

  const safeLimit = Math.min(Math.max(1, limit), 50);

  switch (type) {
    case 'caseNumber': {
      const rows = await prisma.$queryRawUnsafe<Array<{ value: string }>>(
        `SELECT DISTINCT "caseNumber" AS value
         FROM "public_cases"
         WHERE "caseNumber" ILIKE $1
         ORDER BY value
         LIMIT $2`,
        `${query}%`,
        safeLimit,
      );
      return rows.map(r => r.value).filter(Boolean);
    }

    case 'judge': {
      const rows = await prisma.$queryRawUnsafe<Array<{ value: string }>>(
        `SELECT DISTINCT judge AS value
         FROM "public_cases"
         WHERE judge ILIKE $1
         ORDER BY value
         LIMIT $2`,
        `${query}%`,
        safeLimit,
      );
      return rows.map(r => r.value).filter(Boolean);
    }

    case 'court': {
      const rows = await prisma.$queryRawUnsafe<Array<{ value: string }>>(
        `SELECT DISTINCT court AS value
         FROM "public_cases"
         WHERE court ILIKE $1
         ORDER BY value
         LIMIT $2`,
        `${query}%`,
        safeLimit,
      );
      return rows.map(r => r.value).filter(Boolean);
    }

    case 'general':
    default:
      return searchSuggestions(query, safeLimit);
  }
}
