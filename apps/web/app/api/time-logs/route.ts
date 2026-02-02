import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { 
  timeLogSchema, 
  paginationSchema, 
  timeLogFilterSchema 
} from '@/lib/validations/schemas'

/**
 * GET /api/time-logs - List all time logs with filters and statistics
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
    const filterResult = timeLogFilterSchema.safeParse({
      caseId: searchParams.get('caseId'),
      billable: searchParams.get('billable'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
    })

    if (!filterResult.success) {
      return validationErrorResponse(filterResult.error.format())
    }

    const filters = filterResult.data

    // Build where clause
    const where: any = {}
    
    if (filters.caseId) where.caseId = filters.caseId
    if (filters.billable !== undefined) where.billable = filters.billable
    
    if (filters.dateFrom || filters.dateTo) {
      where.logDate = {}
      if (filters.dateFrom) where.logDate.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.logDate.lte = new Date(filters.dateTo)
    }

    // Get total count
    const total = await prisma.timeLog.count({ where })

    // Get time logs
    const timeLogs = await prisma.timeLog.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        logDate: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    // Calculate statistics
    const stats = await prisma.timeLog.aggregate({
      where,
      _sum: {
        hours: true,
      },
      _count: {
        id: true,
      },
    })

    // Calculate billable vs non-billable hours
    const billableStats = await prisma.timeLog.aggregate({
      where: { ...where, billable: true },
      _sum: {
        hours: true,
      },
    })

    const statistics = {
      totalHours: Number(stats._sum.hours || 0),
      totalLogs: stats._count.id || 0,
      billableHours: Number(billableStats._sum.hours || 0),
      nonBillableHours: Number(stats._sum.hours || 0) - Number(billableStats._sum.hours || 0),
    }

    return successResponse(
      { timeLogs, statistics },
      {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      }
    )
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

/**
 * POST /api/time-logs - Create a new time log entry
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    // Validate input
    const validationResult = timeLogSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.format())
    }

    const data = validationResult.data

    // Create time log
    const timeLog = await prisma.timeLog.create({
      data: {
        caseId: data.caseId,
        description: data.description,
        hours: data.hours,
        hourlyRate: data.hourlyRate,
        billable: data.billable,
        logDate: new Date(data.logDate),
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true,
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
        caseId: data.caseId,
        type: 'CASE_UPDATED',
        action: 'created',
        description: `Logged ${data.hours} hours: ${data.description}`,
      },
    })

    return successResponse(timeLog)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
