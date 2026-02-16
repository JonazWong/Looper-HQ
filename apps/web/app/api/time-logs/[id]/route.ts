import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse,
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { updateTimeLogSchema } from '@/lib/validations/schemas'

// Force dynamic rendering (required for auth checks and dynamic params)
export const dynamic = 'force-dynamic'

/**
 * GET /api/time-logs/[id] - Get time log details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()

    const timeLog = await prisma.timeLog.findUnique({
      where: { id: (await params).id },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title_zh: true,
            title_en: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            lawyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!timeLog) {
      throw new NotFoundError('Time log')
    }

    return successResponse(timeLog)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * PATCH /api/time-logs/[id] - Update time log
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    const validationResult = updateTimeLogSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Check if time log exists
    const existingTimeLog = await prisma.timeLog.findUnique({
      where: { id: (await params).id },
    })

    if (!existingTimeLog) {
      throw new NotFoundError('Time log')
    }

    // Prepare update data
    const updateData: any = {}
    if (data.description !== undefined) updateData.description = data.description
    if (data.hours !== undefined) updateData.hours = data.hours
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate
    if (data.billable !== undefined) updateData.billable = data.billable
    if (data.logDate !== undefined) updateData.logDate = new Date(data.logDate)

    // Update time log
    const timeLog = await prisma.timeLog.update({
      where: { id: (await params).id },
      data: updateData,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title_zh: true,
            title_en: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            lawyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        caseId: existingTimeLog.caseId,
        type: 'CASE_UPDATED',
        action: 'updated',
        description: `Updated time log: ${timeLog.description}`,
      },
    })

    return successResponse(timeLog)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * DELETE /api/time-logs/[id] - Delete a time log
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()

    // Check if time log exists
    const timeLog = await prisma.timeLog.findUnique({
      where: { id: (await params).id },
    })

    if (!timeLog) {
      throw new NotFoundError('Time log')
    }

    // Delete time log
    await prisma.timeLog.delete({
      where: { id: (await params).id },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        caseId: timeLog.caseId,
        type: 'CASE_UPDATED',
        action: 'deleted',
        description: `Deleted time log: ${timeLog.description}`,
      },
    })

    return successResponse({ message: 'Time log deleted successfully' })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
