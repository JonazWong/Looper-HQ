import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { caseSchema, paginationSchema, caseFilterSchema } from '@/lib/validations/schemas'

// Force dynamic rendering (required for auth checks)
export const dynamic = 'force-dynamic'

/**
 * GET /api/cases - List all cases with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
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

    // Parse filters
    const filterResult = caseFilterSchema.safeParse({
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      category: searchParams.get('category'),
      clientId: searchParams.get('clientId'),
      lawyerId: searchParams.get('lawyerId'),
      search: searchParams.get('search'),
    })

    if (!filterResult.success) {
      return validationErrorResponse(filterResult.error.format())
    }

    const filters = filterResult.data

    // Build where clause
    const where: any = {}
    
    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.category) where.category = filters.category
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.lawyerId) where.lawyerId = filters.lawyerId
    
    if (filters.search) {
      where.OR = [
        { caseNumber: { contains: filters.search, mode: 'insensitive' } },
        { title_zh: { contains: filters.search, mode: 'insensitive' } },
        { title_en: { contains: filters.search, mode: 'insensitive' } },
        { description_zh: { contains: filters.search, mode: 'insensitive' } },
        { description_en: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.case.count({ where })

    // Get cases
    const cases = await prisma.case.findMany({
      where,
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
        _count: {
          select: {
            documents: true,
            activities: true,
            notes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
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

/**
 * POST /api/cases - Create a new case
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    const validationResult = caseSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Generate case number (format: HK-YYYY-XXX)
    const year = new Date().getFullYear()
    const lastCase = await prisma.case.findFirst({
      where: {
        caseNumber: {
          startsWith: `HK-${year}-`,
        },
      },
      orderBy: {
        caseNumber: 'desc',
      },
    })

    let caseNumber = `HK-${year}-001`
    if (lastCase) {
      const lastNumber = parseInt(lastCase.caseNumber.split('-')[2])
      caseNumber = `HK-${year}-${String(lastNumber + 1).padStart(3, '0')}`
    }

    // Create case
    const newCase = await prisma.case.create({
      data: {
        ...data,
        caseNumber,
        courtDate: data.courtDate ? new Date(data.courtDate) : null,
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
        caseId: newCase.id,
        activityType: 'CASE_CREATED',
        action: 'created',
        description: `Created case: ${newCase.title_zh} / ${newCase.title_en}`,
      },
    })

    return successResponse(newCase)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
