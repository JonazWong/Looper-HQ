import { NextRequest } from 'next/server'
import { runPipeline } from '@/lib/services/ai-pipeline'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireRole } from '@/lib/api/auth'
import { pipelineSchema } from '@/lib/validations/schemas'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN', 'LAWYER')

    const body = await request.json()

    const parsed = pipelineSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format())
    }

    const { publicCaseId, steps } = parsed.data

    const result = await runPipeline(publicCaseId, steps)

    return successResponse(result)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
