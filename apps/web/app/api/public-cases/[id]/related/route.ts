import { NextRequest } from 'next/server'
import { getRelatedCases } from '@/lib/services/recommendations'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(5),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format())
    }

    const { limit } = parsed.data
    const related = await getRelatedCases(id, limit)

    return successResponse(related)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
