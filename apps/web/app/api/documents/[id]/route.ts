import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse,
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { updateDocumentSchema } from '@/lib/validations/schemas'

/**
 * GET /api/documents/[id] - Get document details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const params = await context.params

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!document) {
      throw new NotFoundError('Document')
    }

    return successResponse(document)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * PATCH /api/documents/[id] - Update document metadata
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const params = await context.params
    const body = await request.json()

    // Validate input
    const validationResult = updateDocumentSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!existingDocument) {
      throw new NotFoundError('Document')
    }

    // Update document
    const document = await prisma.document.update({
      where: { id: params.id },
      data,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity if associated with a case
    if (document.caseId) {
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          caseId: document.caseId,
          type: 'CASE_UPDATED',
          action: 'updated',
          description: `Updated document: ${document.fileName}`,
        },
      })
    }

    return successResponse(document)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * DELETE /api/documents/[id] - Delete a document
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const params = await context.params

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      throw new NotFoundError('Document')
    }

    // Delete document
    await prisma.document.delete({
      where: { id: params.id },
    })

    // Log activity if associated with a case
    if (document.caseId) {
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          caseId: document.caseId,
          type: 'CASE_UPDATED',
          action: 'deleted',
          description: `Deleted document: ${document.fileName}`,
        },
      })
    }

    return successResponse({ message: 'Document deleted successfully' })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
