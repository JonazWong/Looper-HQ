import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse,
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { caseNoteSchema } from '@/lib/validations/schemas'

// Force dynamic rendering (required for auth checks and dynamic params)
export const dynamic = 'force-dynamic'

/**
 * GET /api/cases/[id]/notes - Get case notes
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

    const notes = await prisma.caseNote.findMany({
      where: { caseId: id },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse(notes)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * POST /api/cases/[id]/notes - Add case note
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
    const validationResult = caseNoteSchema.safeParse(body)

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

    // Create note
    const note = await prisma.caseNote.create({
      data: {
        ...data,
        caseId: id,
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        caseId: id,
        activityType: 'NOTE_ADDED',
        action: 'added',
        description: 'Added a note to the case',
      },
    })

    return successResponse(note)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
