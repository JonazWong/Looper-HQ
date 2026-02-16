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

// Force dynamic rendering (required for auth checks and dynamic params)
export const dynamic = 'force-dynamic'

/**
 * GET /api/documents/[id] - Get document details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()

    const document = await prisma.document.findUnique({
      where: { id: (await params).id },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title_zh: true,
            title_en: true,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    const validationResult = updateDocumentSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id: (await params).id },
    })

    if (!existingDocument) {
      throw new NotFoundError('Document')
    }

    // Update document
    const document = await prisma.document.update({
      where: { id: (await params).id },
      data,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title_zh: true,
            title_en: true,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: (await params).id },
    })

    if (!document) {
      throw new NotFoundError('Document')
    }

    // Delete document
    await prisma.document.delete({
      where: { id: (await params).id },
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
