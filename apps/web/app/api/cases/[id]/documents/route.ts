import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse,
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { documentSchema } from '@/lib/validations/schemas'

// Force dynamic rendering (required for auth checks and dynamic params)
export const dynamic = 'force-dynamic'

/**
 * GET /api/cases/[id]/documents - Get case documents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params

    // Check if case exists
    const caseData = await prisma.case.findUnique({
      where: { id },
    })

    if (!caseData) {
      throw new NotFoundError('Case')
    }

    const documents = await prisma.document.findMany({
      where: { caseId: id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    return successResponse(documents)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * POST /api/cases/[id]/documents - Upload document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Validate input
    const validationResult = documentSchema.safeParse({
      ...body,
      caseId: id,
    })

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Check if case exists
    const caseData = await prisma.case.findUnique({
      where: { id },
    })

    if (!caseData) {
      throw new NotFoundError('Case')
    }

    // Create document
    const document = await prisma.document.create({
      data: {
        ...data,
        caseId: id,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
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
        caseId: id,
        activityType: 'DOCUMENT_UPLOADED',
        action: 'uploaded',
        description: `Uploaded document: ${document.fileName}`,
      },
    })

    return successResponse(document)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
