import { NextRequest, NextResponse } from 'next/server';
import { getTrendingSearches } from '@/lib/services/search-engine';

/**
 * GET /api/search/trending - Get trending search keywords
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
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
