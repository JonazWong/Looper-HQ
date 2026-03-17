/**
 * Unified AI Client for Looper-HQ
 * Supports OpenAI, OpenRouter, and Azure OpenAI
 * 
 * Usage:
 * ```ts
 * import { generateCompletion } from '@looper-hq/utils/ai-client'
 * 
 * const result = await generateCompletion({
 *   systemPrompt: 'You are a legal assistant',
 *   userPrompt: 'Summarize this case',
 *   model: 'gpt-4o-mini', // optional
 * })
 * ```
 */

import OpenAI from 'openai'

type Provider = 'openai' | 'openrouter' | 'azure' | 'custom'

const provider = (process.env.AI_PROVIDER as Provider) || 'openai'

/**
 * Create OpenAI client based on AI_PROVIDER
 */
function createClient(): OpenAI {
  // Azure OpenAI
  if (provider === 'azure') {
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
      throw new Error('Azure OpenAI requires AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY')
    }

    return new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview' },
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
    })
  }

  // OpenRouter
  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenRouter requires OPENROUTER_API_KEY or OPENAI_API_KEY')
    }

    return new OpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    })
  }

  // Default: OpenAI
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI requires OPENAI_API_KEY environment variable')
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  })
}

// Lazy initialization - only create client when first needed
let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    client = createClient()
  }
  return client
}

export interface CompletionParams {
  systemPrompt?: string
  userPrompt: string
  model?: string
  maxTokens?: number
  temperature?: number
  jsonMode?: boolean
}

/**
 * Generate AI completion with unified interface
 */
export async function generateCompletion(params: CompletionParams): Promise<string> {
  const {
    systemPrompt,
    userPrompt,
    model = process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens = Number(process.env.AI_MAX_TOKENS || 2048),
    temperature = Number(process.env.AI_TEMPERATURE || 0.3),
    jsonMode = false,
  } = params

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: userPrompt })

  try {
    const response = await getClient().chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode && { response_format: { type: 'json_object' } }),
    })

    return response.choices?.[0]?.message?.content ?? ''
  } catch (error) {
    console.error('[AI Client] Completion failed:', error)
    throw new Error(`AI completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate streaming completion
 */
export async function* generateStreamingCompletion(params: CompletionParams): AsyncGenerator<string> {
  const {
    systemPrompt,
    userPrompt,
    model = process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens = Number(process.env.AI_MAX_TOKENS || 2048),
    temperature = Number(process.env.AI_TEMPERATURE || 0.3),
  } = params

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: userPrompt })

  try {
    const stream = await getClient().chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  } catch (error) {
    console.error('[AI Client] Streaming failed:', error)
    throw new Error(`AI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate embedding vector for given text
 */
export async function generateEmbedding(
  text: string,
  model?: string,
): Promise<number[]> {
  const embeddingModel = model || process.env.EMBEDDING_MODEL || 'text-embedding-3-large'

  // Optional dimension hint from environment; used both for request and validation.
  const envDimensions = process.env.EMBEDDING_DIMENSIONS
  const parsedDimensions = envDimensions ? Number(envDimensions) : undefined
  const dimensions =
    parsedDimensions && Number.isFinite(parsedDimensions) && parsedDimensions > 0
      ? Math.floor(parsedDimensions)
      : undefined

  try {
    const response = await getClient().embeddings.create({
      model: embeddingModel,
      input: text,
      // Only pass dimensions when we have a valid positive integer and the SDK supports it.
      ...(dimensions ? { dimensions } : {}),
    })

    const embedding = response.data?.[0]?.embedding

    if (!embedding || !Array.isArray(embedding)) {
      console.error('[AI Client] Embedding response missing or invalid:', response)
      throw new Error('AI embedding failed: invalid embedding response')
    }

    if (dimensions && embedding.length !== dimensions) {
      console.warn(
        `[AI Client] Embedding dimension mismatch: expected ${dimensions}, got ${embedding.length}`,
      )
    }

    return embedding
  } catch (error) {
    console.error('[AI Client] Embedding failed:', error)
    throw new Error(`AI embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get current AI provider info
 */
export function getProviderInfo() {
  return {
    provider,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    locale: process.env.AI_DEFAULT_LOCALE || 'zh-HK',
    maxTokens: Number(process.env.AI_MAX_TOKENS || 2048),
    temperature: Number(process.env.AI_TEMPERATURE || 0.3),
  }
}
