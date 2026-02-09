import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { search, searchSuggestions } from '@/lib/services/search-engine';
import { z } from 'zod';
import { CaseSource } from '@prisma/client';

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  source: z.nativeEnum(CaseSource).optional(),
  category: z.string().optional(),
  court: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  mode: z.enum(['fulltext', 'semantic', 'hybrid']).default('fulltext'),
});

/**
 * GET /api/search - Public case search with full-text search support
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchSchema.parse(Object.fromEntries(searchParams));
    
    const results = await search({
      query: params.q,
      source: params.source,
      category: params.category,
      court: params.court,
      dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
      dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
      page: params.page,
      limit: params.limit,
      searchMode: params.mode,
    });
    
    // Log search (get IP from headers)
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '0.0.0.0';

    await prisma.searchHistory.create({
      data: {
        ipAddress,
        query: params.q,
        resultsCount: results.total,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        cases: results.cases,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: results.total,
          totalPages: Math.ceil(results.total / params.limit),
        },
        took: results.took,
        mode: params.mode,
      },
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
