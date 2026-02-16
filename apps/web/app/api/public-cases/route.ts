import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { search } from '@/lib/services/search-engine';
import { CaseSource } from '@looper-hq/database';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().optional(),
  source: z.nativeEnum(CaseSource).optional(),
  category: z.string().optional(),
  court: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  mode: z.enum(['fulltext', 'semantic', 'hybrid']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchSchema.parse(Object.fromEntries(searchParams));

    const { query, source, category, court, dateFrom, dateTo, page, limit, mode } = params;

    // If no query, use simple Prisma query for better performance
    if (!query) {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (source) where.source = source;
      if (category) where.category = { contains: category, mode: 'insensitive' };
      if (court) where.court = { contains: court, mode: 'insensitive' };
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

      return NextResponse.json({
        success: true,
        data: {
          cases,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          took: 0,
        },
      });
    }

    // Use full-text search engine for queries
    const results = await search({
      query,
      source,
      category,
      court,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page,
      limit,
      searchMode: mode || 'fulltext',
    });

    return NextResponse.json({
      success: true,
      data: {
        cases: results.cases,
        pagination: {
          page,
          limit,
          total: results.total,
          totalPages: Math.ceil(results.total / limit),
        },
        took: results.took,
        mode: mode || 'fulltext',
      },
    });
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
