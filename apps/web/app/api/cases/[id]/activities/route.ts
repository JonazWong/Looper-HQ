import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse 
} from '@/lib/api/response'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'

/**
 * GET /api/cases/[id]/activities - Get case activity log
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    // Check if case exists
    const caseData = await prisma.case.findUnique({
      where: { id: params.id },
    })

    if (!caseData) {
      throw new NotFoundError('Case')
    }

    const activities = await prisma.activity.findMany({
      where: { caseId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse(activities)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
