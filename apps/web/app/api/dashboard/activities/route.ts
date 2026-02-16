import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse 
} from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { paginationSchema } from '@/lib/validations/schemas'

// Force dynamic rendering (required for auth checks)
export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/activities - Recent activity feed
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const searchParams = request.nextUrl.searchParams

    // Parse pagination
    const paginationResult = paginationSchema.safeParse({
      page: searchParams.get('page'),
      perPage: searchParams.get('perPage') || '20',
    })

    if (!paginationResult.success) {
      return errorResponse('Invalid pagination parameters', 400)
    }

    const { page, perPage } = paginationResult.data

    // Get total count
    const total = await prisma.activity.count()

    // Get activities
    const activities = await prisma.activity.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            title_zh: true,
            title_en: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return successResponse(activities, {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
