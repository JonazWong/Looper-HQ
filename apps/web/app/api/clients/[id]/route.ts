import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse,
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError, NotFoundError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { updateClientSchema } from '@/lib/validations/schemas'

/**
 * GET /api/clients/[id] - Get client details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const { id } = params

    const client = await prisma.client.findUnique({
      where: { id },
    })

    if (!client) {
      throw new NotFoundError('Client')
    }

    return successResponse(client)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * PATCH /api/clients/[id] - Update client
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { id } = params
    const body = await request.json()

    // Validate input
    const validationResult = updateClientSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    })

    if (!existingClient) {
      throw new NotFoundError('Client')
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id },
      data,
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: 'CLIENT_ADDED',
        action: 'updated',
        description: `Updated client: ${updatedClient.fullName}`,
      },
    })

    return successResponse(updatedClient)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
