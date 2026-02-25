/**
 * Admin Dashboard Page
 * Crawler monitoring, RSS source management, database stats, and system settings.
 * Requires ADMIN role.
 */

import { requireRole } from '@/lib/api/auth'
import { prisma } from '@/lib/db'
import { AdminDashboardClient } from './admin-dashboard-client'

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

    return { rssSources, totalPublicCases, todayPublicCases }
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
