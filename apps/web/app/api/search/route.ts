import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse,
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { searchSchema, paginationSchema } from '@/lib/validations/schemas'

/**
 * POST /api/search - Public case search
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = searchSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const { query, category, dateFrom, dateTo, status } = validationResult.data

    // Parse pagination from query params
    const searchParams = request.nextUrl.searchParams
    const paginationResult = paginationSchema.safeParse({
      page: searchParams.get('page'),
      perPage: searchParams.get('perPage'),
    })

    if (!paginationResult.success) {
      return validationErrorResponse(paginationResult.error.format())
    }

    const { page, perPage } = paginationResult.data

    // Build where clause - only search public cases
    const where: any = {
      isPublic: true,
    }

    // Add text search
    where.OR = [
      { caseNumber: { contains: query, mode: 'insensitive' } },
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { publicNote: { contains: query, mode: 'insensitive' } },
    ]

    // Add filters
    if (category) where.category = category
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.startDate = {}
      if (dateFrom) where.startDate.gte = new Date(dateFrom)
      if (dateTo) where.startDate.lte = new Date(dateTo)
    }

    // Get total count
    const total = await prisma.case.count({ where })

    // Get cases
    const cases = await prisma.case.findMany({
      where,
      select: {
        id: true,
        caseNumber: true,
        title: true,
        category: true,
        status: true,
        priority: true,
        startDate: true,
        publicNote: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    // Log search (get IP from headers)
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '0.0.0.0'

    await prisma.searchHistory.create({
      data: {
        ipAddress,
        query,
        resultsCount: total,
      },
    })

    return successResponse(cases, {
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
