/**
 * Admin Dashboard Page
 * Crawler monitoring, RSS source management, database stats, and system settings.
 * Requires ADMIN role.
 */

import { requireRole } from '@/lib/api/auth'
import { prisma } from '@/lib/db'
import { AdminDashboardClient } from './admin-dashboard-client'

// Type definition matching client component props
type SerializedRssSource = {
  id: string
  name: string
  url: string
  source: string
  isActive: boolean
  status: string
  lastFetchAt: string | null
  lastError: string | null
}

type SerializedJobRun = {
  id: string
  status: string
  totalAdded: number
  totalErrors: number
  durationSeconds: number | null
  startedAt: string
  completedAt: string | null
  triggeredBy: string
}

async function getAdminData() {
  try {
    const [rssSources, totalPublicCases, todayPublicCases, latestJobRun, recentJobRuns] = await Promise.all([
      prisma.rssSource.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.publicCase.count(),
      prisma.publicCase.count({
        where: {
          crawledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.crawlerJobRun.findFirst({
        orderBy: { startedAt: 'desc' },
      }),
      prisma.crawlerJobRun.findMany({
        take: 5,
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
    ])

    // Serialize Date fields to strings for client component
    const serializedRssSources: SerializedRssSource[] = rssSources.map(source => ({
      id: source.id,
      name: source.name,
      url: source.url,
      source: source.source as string,
      isActive: source.isActive,
      status: source.status as string,
      lastFetchAt: source.lastFetchAt?.toISOString() ?? null,
      lastError: source.lastError ?? null,
    }))

    const serializedLatestJobRun: SerializedJobRun | null = latestJobRun
      ? {
          id: latestJobRun.id,
          status: latestJobRun.status as string,
          totalAdded: latestJobRun.totalAdded,
          totalErrors: latestJobRun.totalErrors,
          durationSeconds: latestJobRun.durationSeconds,
          startedAt: latestJobRun.startedAt.toISOString(),
          completedAt: latestJobRun.completedAt?.toISOString() ?? null,
          triggeredBy: latestJobRun.triggeredBy,
        }
      : null

    const serializedRecentJobRuns: SerializedJobRun[] = recentJobRuns.map(r => ({
      id: r.id,
      status: r.status as string,
      totalAdded: r.totalAdded,
      totalErrors: r.totalErrors,
      durationSeconds: r.durationSeconds,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
      triggeredBy: r.triggeredBy,
    }))

    return { 
      rssSources: serializedRssSources, 
      totalPublicCases, 
      todayPublicCases,
      latestJobRun: serializedLatestJobRun,
      recentJobRuns: serializedRecentJobRuns,
    }
  } catch (error) {
    console.error('Failed to fetch admin data:', error)
    return { rssSources: [], totalPublicCases: 0, todayPublicCases: 0, latestJobRun: null, recentJobRuns: [] }
  }
}

export default async function AdminPage() {
  await requireRole('ADMIN')
  const data = await getAdminData()
  return <AdminDashboardClient {...data} />
}
