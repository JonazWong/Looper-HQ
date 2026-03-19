import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['crawledAt', 'judgmentDate']).default('crawledAt'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const judgeName = decodeURIComponent(name)
    const { searchParams } = new URL(request.url)

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format())
    }

    const { page, limit, sort } = parsed.data
    const skip = (page - 1) * limit

    const where = { judge: { contains: judgeName, mode: 'insensitive' as const } }

    const [cases, total] = await Promise.all([
      prisma.publicCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: 'desc' },
        select: {
          id: true,
          title_zh: true,
          title_en: true,
          caseNumber: true,
          neutralCitation: true,
          court: true,
          judge: true,
          judgmentDate: true,
          category: true,
          crawledAt: true,
          sourceUrl: true,
        },
      }),
      prisma.publicCase.count({ where }),
    ])

    return successResponse(
      { judge: judgeName, cases },
      { page, limit, total, totalPages: Math.ceil(total / limit) },
    )
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
