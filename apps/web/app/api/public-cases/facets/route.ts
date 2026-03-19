import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CaseSource } from '@looper-hq/database';
import { getSearchFacets } from '@/lib/services/search-engine';

// Force dynamic rendering (handles query parameters)
export const dynamic = 'force-dynamic';

const facetsSchema = z.object({
  query: z.string().optional(),
  source: z.nativeEnum(CaseSource).optional(),
  category: z.string().optional(),
  court: z.string().optional(),
  judge: z.string().optional(),
  year: z.coerce.number().int().min(1800).max(2100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  topN: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/public-cases/facets
 *
 * Returns facet counts for court / year / category / judge dimensions,
 * filtered by the same query parameters used in the main search endpoint.
 *
 * Example:
 *   GET /api/public-cases/facets?query=theft&court=CFI
 *   → { courts: [...], years: [...], categories: [...], judges: [...] }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = facetsSchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { query, source, category, court, judge, year, dateFrom, dateTo, topN } = parsed.data;

    const facets = await getSearchFacets(
      {
        query: query ?? '',
        source,
        category,
        court,
        judge,
        year,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      },
      topN,
    );

    return NextResponse.json({ success: true, data: facets });
  } catch (error: any) {
    console.error('Facets API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get facets' },
      { status: 500 },
    );
  }
}
