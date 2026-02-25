/**
 * GET /api/search-history - User search history
 * Returns mock data for now - can be enhanced with actual database tracking
 */

import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // TODO: Implement actual search history tracking in database
    // For now, return mock data
    const mockSearchHistory = [
      {
        id: '1',
        keyword: '商業訴訟',
        resultCount: 156,
        searchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        id: '2',
        keyword: 'HCAL 123/2024',
        resultCount: 3,
        searchedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      },
      {
        id: '3',
        keyword: '刑事案件',
        resultCount: 234,
        searchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
    ]

    const limitedResults = mockSearchHistory.slice(0, limit)

    return successResponse(limitedResults)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
