import { NextRequest } from 'next/server'
import { summarizePublicCase } from '@/lib/services/summarizer'
import { generateCompletion } from '@looper-hq/utils'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { summarizeSchema } from '@/lib/validations/schemas'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()

    const parsed = summarizeSchema.safeParse(body)
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format())
    }

    const { publicCaseId, text } = parsed.data

    if (publicCaseId) {
      const result = await summarizePublicCase(publicCaseId)
      return successResponse(result)
    }

    // Ad-hoc text summarization
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const maxLength = Number(process.env.AI_SUMMARIZE_MAX_LENGTH || 500)

    const response = await generateCompletion({
      systemPrompt: `你是專業的香港法律案例分析助手。請為以下文本生成雙語摘要（繁體中文和英文），每份摘要不超過 ${maxLength} 字元。請以 JSON 格式回覆：{ "summary_zh": "...", "summary_en": "..." }`,
      userPrompt: text!.substring(0, 4000),
      model,
      maxTokens: 1200,
      jsonMode: true,
    })

    let summary_zh = ''
    let summary_en = ''
    try {
      const parsed = JSON.parse(response)
      summary_zh = parsed.summary_zh ?? ''
      summary_en = parsed.summary_en ?? ''
    } catch {
      summary_zh = response.trim()
      summary_en = response.trim()
    }

    return successResponse({ summary_zh, summary_en, sourceLength: text!.length })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
