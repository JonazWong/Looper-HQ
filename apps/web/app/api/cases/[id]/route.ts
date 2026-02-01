import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { updateCaseSchema } from '@/lib/validations/schemas'

/**
 * GET /api/cases/[id] - Get case details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const caseData = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        lawyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
          take: 10,
        },
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        notes: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        timeLogs: {
          orderBy: {
            logDate: 'desc',
          },
          take: 10,
        },
        invoices: {
          orderBy: {
            issueDate: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            documents: true,
            activities: true,
            notes: true,
            timeLogs: true,
            invoices: true,
          },
        },
      },
    })

    if (!caseData) {
      throw new NotFoundError('Case')
    }

    return successResponse(caseData)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * PATCH /api/cases/[id] - Update case
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    const validationResult = updateCaseSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Check if case exists
    const existingCase = await prisma.case.findUnique({
      where: { id: params.id },
    })

    if (!existingCase) {
      throw new NotFoundError('Case')
    }

    // Update case
    const updatedCase = await prisma.case.update({
      where: { id: params.id },
      data: {
        ...data,
        courtDate: data.courtDate ? new Date(data.courtDate) : undefined,
      },
      include: {
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
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        caseId: updatedCase.id,
        type: 'CASE_UPDATED',
        action: 'updated',
        description: `Updated case: ${updatedCase.title}`,
      },
    })

    return successResponse(updatedCase)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * DELETE /api/cases/[id] - Archive case
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    // Check if case exists
    const existingCase = await prisma.case.findUnique({
      where: { id: params.id },
    })

    if (!existingCase) {
      throw new NotFoundError('Case')
    }

    // Archive instead of delete
    const archivedCase = await prisma.case.update({
      where: { id: params.id },
      data: {
        status: 'ARCHIVED',
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        caseId: archivedCase.id,
        type: 'CASE_UPDATED',
        action: 'archived',
        description: `Archived case: ${archivedCase.title}`,
      },
    })

    return successResponse({ message: 'Case archived successfully' })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
