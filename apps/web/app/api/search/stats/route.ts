import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse 
} from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'

// Force dynamic rendering (handles query parameters)
export const dynamic = 'force-dynamic'

/**
 * GET /api/search/stats - Search statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get search statistics
    const totalSearches = await prisma.searchHistory.count()
    
    const recentSearches = await prisma.searchHistory.findMany({
      take: 10,
      orderBy: {
        searchedAt: 'desc',
      },
    })

    // Get top search queries
    const topQueries = await prisma.$queryRaw<Array<{ query: string; count: number }>>`
      SELECT query, COUNT(*)::int as count
      FROM search_history
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `

    return successResponse({
      totalSearches,
      recentSearches,
      topQueries,
    })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
