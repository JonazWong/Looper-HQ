import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse,
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { clientSchema, paginationSchema } from '@/lib/validations/schemas'

// Force dynamic rendering (required for auth checks)
export const dynamic = 'force-dynamic'

/**
 * GET /api/clients - List all clients
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const searchParams = request.nextUrl.searchParams

    // Parse pagination
    const paginationResult = paginationSchema.safeParse({
      page: searchParams.get('page'),
      perPage: searchParams.get('perPage'),
    })

    if (!paginationResult.success) {
      return validationErrorResponse(paginationResult.error.format())
    }

    const { page, perPage } = paginationResult.data

    // Build where clause
    const where: any = {}
    const search = searchParams.get('search')
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.client.count({ where })

    // Get clients
    const clients = await prisma.client.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    return successResponse(clients, {
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

/**
 * POST /api/clients - Create a new client
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    const validationResult = clientSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Create client
    const client = await prisma.client.create({
      data,
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        activityType: 'CLIENT_ADDED',
        action: 'created',
        description: `Created client: ${client.fullName}`,
      },
    })

    return successResponse(client)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
