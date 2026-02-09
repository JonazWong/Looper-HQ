import { NextRequest, NextResponse } from 'next/server';
import { getTrendingSearches } from '@/lib/services/search-engine';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * GET /api/search/trending - Get trending search keywords
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get('limit');
    let limit = Number.parseInt(rawLimit ?? '', 10);

    if (Number.isNaN(limit) || limit <= 0) {
      limit = DEFAULT_LIMIT;
    } else if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }
    
    const trending = await getTrendingSearches(limit);
    
    return NextResponse.json({
      success: true,
      data: { trending },
    });
  } catch (error: any) {
    console.error('Trending API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get trending searches' },
      { status: 500 }
    );
  }
}
