/**
 * GET /api/stats/crawler - Crawler job run statistics for admin dashboard
 * Returns the latest job run and recent history.
 * Requires ADMIN role.
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireRole } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN')

    const [latestRun, recentRuns, totalRuns] = await Promise.all([
      prisma.crawlerJobRun.findFirst({
        orderBy: { startedAt: 'desc' },
      }),
      prisma.crawlerJobRun.findMany({
        take: 10,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          status: true,
          totalAdded: true,
          totalErrors: true,
          durationSeconds: true,
          startedAt: true,
          completedAt: true,
          triggeredBy: true,
        },
      }),
      prisma.crawlerJobRun.count(),
    ])

    return successResponse({
      latestRun: latestRun
        ? {
            ...latestRun,
            startedAt: latestRun.startedAt.toISOString(),
            completedAt: latestRun.completedAt?.toISOString() ?? null,
            createdAt: latestRun.createdAt.toISOString(),
          }
        : null,
      recentRuns: recentRuns.map((r) => ({
        ...r,
        startedAt: r.startedAt.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? null,
      })),
      totalRuns,
    })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
