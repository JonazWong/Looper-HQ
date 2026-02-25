/**
 * GET /api/stats/database - Database statistics for member dashboard
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    // Fetch database stats in parallel
    const [totalCases, todayPublicCases, rssSource] = await Promise.all([
      prisma.publicCase.count(),
      prisma.publicCase.count({
        where: {
          crawledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.rssSource.findFirst({
        orderBy: { lastFetchAt: 'desc' },
        select: { lastFetchAt: true },
      }),
    ])

    // Determine system status based on recent crawler activity
    const lastCrawl = rssSource?.lastFetchAt
    let systemStatus: 'healthy' | 'warning' | 'error' = 'healthy'
    
    if (lastCrawl) {
      const hoursSinceLastCrawl = (Date.now() - lastCrawl.getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastCrawl > 48) {
        systemStatus = 'error'
      } else if (hoursSinceLastCrawl > 24) {
        systemStatus = 'warning'
      }
    } else {
      systemStatus = 'warning'
    }

    return successResponse({
      totalCases,
      todayNew: todayPublicCases,
      courtsCovered: 8, // HK has 8 major court levels
      formsCount: 0, // Placeholder for future forms feature
      crawlerLastRun: lastCrawl?.toISOString() || null,
      systemStatus,
    })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
