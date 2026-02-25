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

async function getAdminData() {
  try {
    const [rssSources, totalPublicCases, todayPublicCases] = await Promise.all([
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

    return { 
      rssSources: serializedRssSources, 
      totalPublicCases, 
      todayPublicCases 
    }
  } catch (error) {
    console.error('Failed to fetch admin data:', error)
    return { rssSources: [], totalPublicCases: 0, todayPublicCases: 0 }
  }
}

export default async function AdminPage() {
  await requireRole('ADMIN')
  const data = await getAdminData()
  return <AdminDashboardClient {...data} />
}
