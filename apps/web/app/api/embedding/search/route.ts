import { NextRequest } from 'next/server'
import { semanticSearch } from '@/lib/services/embedding-service'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { embeddingSearchSchema } from '@/lib/validations/schemas'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = embeddingSearchSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format())
    }

    const { query, limit, threshold } = parsed.data

    const results = await semanticSearch(query, { limit, threshold })

    return successResponse(results)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
