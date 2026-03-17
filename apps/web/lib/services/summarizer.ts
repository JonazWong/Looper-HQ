import { generateCompletion } from '@looper-hq/utils'
import { prisma } from '@/lib/db'
import { NotFoundError } from '@/lib/api/errors'

export interface SummaryResult {
  publicCaseId: string
  summary_zh: string
  summary_en: string
  sourceLength: number
  summaryLength: number
  model: string
}

/**
 * Generate a bilingual summary for a PublicCase and persist it
 */
export async function summarizePublicCase(publicCaseId: string): Promise<SummaryResult> {
  const publicCase = await prisma.publicCase.findUnique({
    where: { id: publicCaseId },
  })

  if (!publicCase) {
    throw new NotFoundError('PublicCase')
  }

  const sourceText = [
    publicCase.title_zh,
    publicCase.title_en,
    publicCase.description_zh,
    publicCase.description_en,
    publicCase.judgment_zh,
    publicCase.judgment_en,
  ]
    .filter(Boolean)
    .join('\n\n')

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const maxLength = Number(process.env.AI_SUMMARIZE_MAX_LENGTH || 500)

  const systemPrompt = `你是專業的香港法律案例分析助手。請為以下法律案件生成一份雙語摘要（繁體中文和英文）。
摘要應包含：案件性質、主要當事人、核心法律問題及裁決結果（如有）。
每份摘要不超過 ${maxLength} 字元。
請以 JSON 格式回覆：{ "summary_zh": "...", "summary_en": "..." }`

  const userPrompt = `案件資料：\n\n${sourceText.substring(0, 4000)}`

  const response = await generateCompletion({
    systemPrompt,
    userPrompt,
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
    // Fallback: use response as Chinese summary
    summary_zh = response.trim()
    summary_en = response.trim()
  }

  const summaryLength = summary_zh.length + summary_en.length

  await prisma.summary.upsert({
    where: { publicCaseId },
    create: {
      publicCaseId,
      summary_zh,
      summary_en,
      sourceLength: sourceText.length,
      summaryLength,
      model,
    },
    update: {
      summary_zh,
      summary_en,
      sourceLength: sourceText.length,
      summaryLength,
      model,
    },
  })

  return {
    publicCaseId,
    summary_zh,
    summary_en,
    sourceLength: sourceText.length,
    summaryLength,
    model,
  }
}

/**
 * Batch summarize multiple PublicCases
 */
export async function batchSummarize(publicCaseIds: string[]): Promise<SummaryResult[]> {
  const results: SummaryResult[] = []
  const batchSize = Number(process.env.AI_PIPELINE_BATCH_SIZE || 10)

  for (let i = 0; i < publicCaseIds.length; i += batchSize) {
    const batch = publicCaseIds.slice(i, i + batchSize)
    for (const id of batch) {
      try {
        const result = await summarizePublicCase(id)
        results.push(result)
        // Rate limiting between requests
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`[Summarizer] Failed to summarize ${id}:`, error)
      }
    }
  }

  return results
}
