import { embedPublicCase } from './embedding-service'
import { classifyCase } from './ai-classifier'
import { translateText } from './translator'
import { summarizePublicCase } from './summarizer'
import { prisma } from '@/lib/db'
import { NotFoundError } from '@/lib/api/errors'

export type PipelineStep = 'embed' | 'classify' | 'translate' | 'summarize'

export interface PipelineResult {
  publicCaseId: string
  steps: PipelineStep[]
  results: {
    embed?: { success: boolean; error?: string }
    classify?: { success: boolean; error?: string }
    translate?: { success: boolean; error?: string }
    summarize?: { success: boolean; error?: string }
  }
  completedAt: string
}

const ALL_STEPS: PipelineStep[] = ['embed', 'classify', 'translate', 'summarize']

/**
 * Run the AI processing pipeline for a PublicCase.
 * Steps can be selectively executed by passing the `steps` parameter.
 */
export async function runPipeline(
  publicCaseId: string,
  steps: PipelineStep[] = ALL_STEPS,
): Promise<PipelineResult> {
  const result: PipelineResult = {
    publicCaseId,
    steps,
    results: {},
    completedAt: new Date().toISOString(),
  }

  const publicCase = await prisma.publicCase.findUnique({
    where: { id: publicCaseId },
  })

  if (!publicCase) {
    throw new NotFoundError('PublicCase')
  }

  // Step 1: Embed
  if (steps.includes('embed')) {
    try {
      await embedPublicCase(publicCaseId)
      result.results.embed = { success: true }
    } catch (error) {
      result.results.embed = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Step 2: Classify
  if (steps.includes('classify')) {
    try {
      const title = publicCase.title_en || publicCase.title_zh
      const content = [publicCase.description_en, publicCase.description_zh]
        .filter(Boolean)
        .join(' ')

      const classification = await classifyCase(title, content)

      await prisma.classification.upsert({
        where: { publicCaseId },
        create: {
          publicCaseId,
          category: classification.category,
          confidence: classification.confidence,
          keywords: classification.keywords,
          entities: {
            parties: classification.parties,
            court: classification.court,
            judge: classification.judge,
          },
        },
        update: {
          category: classification.category,
          confidence: classification.confidence,
          keywords: classification.keywords,
          entities: {
            parties: classification.parties,
            court: classification.court,
            judge: classification.judge,
          },
        },
      })

      result.results.classify = { success: true }
    } catch (error) {
      result.results.classify = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Step 3: Translate
  if (steps.includes('translate')) {
    try {
      const fieldsToTranslate: Array<{ field: string; text: string; direction: 'zh-to-en' | 'en-to-zh' }> = []

      if (publicCase.title_zh) {
        fieldsToTranslate.push({ field: 'title', text: publicCase.title_zh, direction: 'zh-to-en' })
      }
      if (publicCase.description_zh) {
        fieldsToTranslate.push({ field: 'description', text: publicCase.description_zh, direction: 'zh-to-en' })
      }

      for (const { field, text, direction } of fieldsToTranslate) {
        const translated = await translateText(text, direction)
        const [sourceLang, targetLang] = direction === 'zh-to-en' ? ['zh', 'en'] : ['en', 'zh']
        await prisma.translation.upsert({
          where: {
            publicCaseId_sourceField_targetLang: {
              publicCaseId,
              sourceField: field,
              targetLang,
            },
          },
          create: {
            publicCaseId,
            sourceField: field,
            sourceLang,
            targetLang,
            sourceText: text,
            translatedText: translated.translatedText,
          },
          update: {
            sourceText: text,
            translatedText: translated.translatedText,
          },
        })
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      result.results.translate = { success: true }
    } catch (error) {
      result.results.translate = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Step 4: Summarize
  if (steps.includes('summarize')) {
    try {
      await summarizePublicCase(publicCaseId)
      result.results.summarize = { success: true }
    } catch (error) {
      result.results.summarize = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  result.completedAt = new Date().toISOString()
  return result
}
