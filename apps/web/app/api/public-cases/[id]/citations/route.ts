import { NextRequest } from 'next/server'
import { getOutgoingCitations, getIncomingCitations, getCitationCounts } from '@/lib/services/citation-service'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  type: z.enum(['outgoing', 'incoming', 'both']).default('both'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
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

    const { type, limit, offset } = parsed.data

    const [outgoing, incoming, counts] = await Promise.all([
      type !== 'incoming' ? getOutgoingCitations(id, { limit, offset }) : Promise.resolve([]),
      type !== 'outgoing' ? getIncomingCitations(id, { limit, offset }) : Promise.resolve([]),
      getCitationCounts(id),
    ])

    return successResponse({ outgoing, incoming, counts })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
