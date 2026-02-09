import { NextRequest, NextResponse } from 'next/server';
import { searchSuggestions } from '@/lib/services/search-engine';

/**
 * GET /api/search/suggestions - Get search suggestions for autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const rawLimit = searchParams.get('limit');
    const DEFAULT_LIMIT = 5;
    const MAX_LIMIT = 50;

    let limit = Number.parseInt(rawLimit ?? '', 10);
    if (Number.isNaN(limit) || limit <= 0) {
      limit = DEFAULT_LIMIT;
    }
    limit = Math.min(limit, MAX_LIMIT);
    
    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { suggestions: [] },
      });
    }
    
    const suggestions = await searchSuggestions(query, limit);
    
    return NextResponse.json({
      success: true,
      data: { suggestions },
    });
  } catch (error: any) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
