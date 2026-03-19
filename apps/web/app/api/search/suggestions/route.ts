import { NextRequest, NextResponse } from 'next/server';
import { getTypedSuggestions } from '@/lib/services/search-engine';

// Force dynamic rendering (handles query parameters)
export const dynamic = 'force-dynamic'

const VALID_TYPES = ['caseNumber', 'judge', 'court', 'general'] as const;
type SuggestionType = (typeof VALID_TYPES)[number];

/**
 * GET /api/search/suggestions
 *
 * Returns autocomplete suggestions for case numbers, judge names, courts, or general titles.
 *
 * Query params:
 *  - q      : prefix to search (min 1 char)
 *  - type   : 'caseNumber' | 'judge' | 'court' | 'general'  (default: 'general')
 *  - limit  : max results (default 8, max 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const rawType = searchParams.get('type') ?? 'general';
    const type: SuggestionType = VALID_TYPES.includes(rawType as SuggestionType)
      ? (rawType as SuggestionType)
      : 'general';

    const rawLimit = searchParams.get('limit');
    const DEFAULT_LIMIT = 8;
    const MAX_LIMIT = 50;

    let limit = Number.parseInt(rawLimit ?? '', 10);
    if (Number.isNaN(limit) || limit <= 0) {
      limit = DEFAULT_LIMIT;
    }
    limit = Math.min(limit, MAX_LIMIT);

    if (!query || query.length < 1) {
      return NextResponse.json({
        success: true,
        data: { suggestions: [] },
      });
    }

    const suggestions = await getTypedSuggestions(query, type, limit);

    return NextResponse.json({
      success: true,
      data: { suggestions, type },
    });
  } catch (error: any) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
