import { generateEmbedding } from '@/lib/utils/embeddings'
import { prisma } from '@/lib/db'
import { NotFoundError } from '@/lib/api/errors'

// Upper bound on how many embeddings we load and score per query to avoid
// unbounded O(N·D) work as the embeddings table grows.
// This path is only used as a fallback when pgvector is unavailable.
const MAX_EMBEDDING_CANDIDATES = 2000

export interface SearchResult {
  publicCaseId: string
  similarity: number
  publicCase: {
    id: string
    title_zh: string
    title_en: string
    description_zh: string | null
    description_en: string | null
    category: string | null
    court: string | null
    caseNumber: string | null
    source: string
    crawledAt: Date
  }
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/**
 * Embed a PublicCase and store the embedding vector in the database
 */
export async function embedPublicCase(publicCaseId: string): Promise<void> {
  const publicCase = await prisma.publicCase.findUnique({
    where: { id: publicCaseId },
  })

  if (!publicCase) {
    throw new NotFoundError('PublicCase')
  }

  // Compose source text from bilingual title + description
  const sourceText = [
    publicCase.title_zh,
    publicCase.title_en,
    publicCase.description_zh,
    publicCase.description_en,
  ]
    .filter(Boolean)
    .join(' ')

  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-large'
  const vector = await generateEmbedding(sourceText, model)
  const dimensions = vector.length

  // Format vector as PostgreSQL literal for pgvector: '[x1,x2,...,xN]'
  const vectorLiteral = `[${vector.join(',')}]`

  await prisma.embedding.upsert({
    where: { publicCaseId_sourceField: { publicCaseId, sourceField: 'content' } },
    create: {
      publicCaseId,
      model,
      dimensions,
      embeddingVector: vector,
      sourceField: 'content',
    },
    update: {
      model,
      dimensions,
      embeddingVector: vector,
    },
  })

  // Also write to the pgvector column via raw SQL so the HNSW index is kept up-to-date.
  // This is a best-effort operation; failures here do not affect the Float[] fallback path.
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "embeddings"
       SET "embedding_vector_v" = $1::vector
       WHERE "publicCaseId" = $2 AND "sourceField" = 'content'`,
      vectorLiteral,
      publicCaseId,
    )
  } catch {
    // pgvector extension may not be installed in all environments; silently skip.
  }
}

/**
 * Semantic search: generate a query embedding and rank stored embeddings by cosine similarity
 */
export async function semanticSearch(
  query: string,
  options: { limit?: number; threshold?: number } = {},
): Promise<SearchResult[]> {
  const { limit = 10, threshold = 0.5 } = options

  const queryVector = await generateEmbedding(
    query,
    process.env.EMBEDDING_MODEL || 'text-embedding-3-large',
  )

  // Fetch a bounded set of stored embeddings (MVP: in-memory cosine similarity)
  const embeddings = await prisma.embedding.findMany({
    where: { sourceField: 'content' },
    take: MAX_EMBEDDING_CANDIDATES,
    include: {
      publicCase: {
        select: {
          id: true,
          title_zh: true,
          title_en: true,
          description_zh: true,
          description_en: true,
          category: true,
          court: true,
          caseNumber: true,
          source: true,
          crawledAt: true,
        },
      },
    },
  })

  const scored: SearchResult[] = embeddings
    .map((emb) => ({
      publicCaseId: emb.publicCaseId,
      similarity: cosineSimilarity(queryVector, emb.embeddingVector),
      publicCase: {
        ...emb.publicCase,
        category: emb.publicCase.category ?? null,
      },
    }))
    .filter((r) => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return scored
}
