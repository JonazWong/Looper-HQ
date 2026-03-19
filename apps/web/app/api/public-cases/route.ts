import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { search, getSearchFacets } from '@/lib/services/search-engine';
import { parseQuery } from '@/lib/services/query-parser';
import { CaseSource } from '@looper-hq/database';
import { z } from 'zod';

// Force dynamic rendering (handles query parameters)
export const dynamic = 'force-dynamic'

const searchSchema = z.object({
  query: z.string().optional(),
  source: z.nativeEnum(CaseSource).optional(),
  category: z.string().optional(),
  court: z.string().optional(),
  judge: z.string().optional(),
  year: z.coerce.number().int().min(1800).max(2100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  mode: z.enum(['fulltext', 'semantic', 'hybrid']).optional(),
  /** Include facet counts in the response */
  includeFacets: z.coerce.boolean().default(false),
  /** Include ts_headline highlight snippets in FTS results */
  highlight: z.coerce.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchSchema.parse(Object.fromEntries(searchParams));

    let { query, source, category, court, judge, year, dateFrom, dateTo, page, limit, mode, includeFacets, highlight } = params;

    // ── Advanced query syntax parsing ────────────────────────────────────────
    // If the query contains field:value syntax, extract structured filters
    // and leave the remainder as free-text.
    if (query) {
      const parsed = parseQuery(query);
      // Merge parsed filters (URL params take precedence if explicitly set)
      query = parsed.freeText;

      if (!court && parsed.filters.court?.length) {
        court = parsed.filters.court[0];
      }
      if (!judge && parsed.filters.judge?.length) {
        judge = parsed.filters.judge[0];
      }
      if (!category && parsed.filters.category?.length) {
        category = parsed.filters.category[0];
      }
      if (!year && parsed.filters.year?.length) {
        year = parsed.filters.year[0];
      }
      if (!source && parsed.filters.source?.length) {
        const parsedSource = parsed.filters.source[0];
        if (Object.values(CaseSource).includes(parsedSource as CaseSource)) {
          source = parsedSource as CaseSource;
        }
      }
    }

    // ── No free-text query — fast Prisma path ────────────────────────────────
    if (!query) {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (source) where.source = source;
      if (category) where.category = { contains: category, mode: 'insensitive' };
      if (court) where.court = { contains: court, mode: 'insensitive' };
      if (judge) where.judge = { contains: judge, mode: 'insensitive' };
      if (year) {
        where.judgmentDate = {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        };
      }
      if (dateFrom || dateTo) {
        where.crawledAt = {};
        if (dateFrom) where.crawledAt.gte = new Date(dateFrom);
        if (dateTo) where.crawledAt.lte = new Date(dateTo);
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

      const responseData: any = {
        cases,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        took: 0,
      };

      if (includeFacets) {
        responseData.facets = await getSearchFacets({
          query: '',
          source,
          category,
          court,
          judge,
          year,
          dateFrom: dateFrom ? new Date(dateFrom) : undefined,
          dateTo: dateTo ? new Date(dateTo) : undefined,
        });
      }

      return NextResponse.json({ success: true, data: responseData });
    }

    // ── FTS / semantic / hybrid search ───────────────────────────────────────
    const results = await search({
      query,
      source,
      category,
      court,
      judge,
      year,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page,
      limit,
      searchMode: mode || 'fulltext',
      highlight,
    });

    const responseData: any = {
      cases: results.cases,
      pagination: {
        page,
        limit,
        total: results.total,
        totalPages: Math.ceil(results.total / limit),
      },
      took: results.took,
      mode: mode || 'fulltext',
    };

    if (includeFacets) {
      responseData.facets = await getSearchFacets({
        query,
        source,
        category,
        court,
        judge,
        year,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      });
    }

    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error('Public cases search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
