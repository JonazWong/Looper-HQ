import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse 
} from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'

// Force dynamic rendering (required for auth checks)
export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/stats - Dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    // Get case statistics
    const totalCases = await prisma.case.count()
    const activeCases = await prisma.case.count({ where: { status: 'ACTIVE' } })
    const pendingCases = await prisma.case.count({ where: { status: 'PENDING' } })
    const completedCases = await prisma.case.count({ where: { status: 'COMPLETED' } })
    const archivedCases = await prisma.case.count({ where: { status: 'ARCHIVED' } })

    // Get client statistics
    const totalClients = await prisma.client.count()

    // Get case distribution by status
    const casesByStatus = [
      { label: 'Active', value: activeCases, color: '#D4AF37' },
      { label: 'Pending', value: pendingCases, color: '#4A148C' },
      { label: 'Completed', value: completedCases, color: '#10b981' },
      { label: 'Archived', value: archivedCases, color: '#6b7280' },
    ]

    // Get case distribution by category
    const casesByCategory = await prisma.case.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    })

    // Get case distribution by priority
    const casesByPriority = await prisma.case.groupBy({
      by: ['priority'],
      _count: {
        priority: true,
      },
    })

    // Get recent cases
    const recentCases = await prisma.case.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        lawyer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calculate success rate (completed / total non-cancelled)
    const nonCancelledCases = await prisma.case.count({
      where: {
        status: {
          not: 'CANCELLED',
        },
      },
    })
    const successRate = nonCancelledCases > 0 
      ? Math.round((completedCases / nonCancelledCases) * 100) 
      : 0

    return successResponse({
      totalCases,
      activeCases,
      pendingCases,
      completedCases,
      archivedCases,
      totalClients,
      successRate,
      casesByStatus,
      casesByCategory: casesByCategory.map((item: any) => ({
        label: item.category,
        value: item._count.category,
      })),
      casesByPriority: casesByPriority.map((item: any) => ({
        label: item.priority,
        value: item._count.priority,
      })),
      recentCases,
    })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
