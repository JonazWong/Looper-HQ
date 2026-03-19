/**
 * Recommendations Service
 * Returns related public cases based on category, court, and keyword overlap.
 * Falls back gracefully when pgvector is unavailable.
 */

import { prisma } from '@/lib/db'

export interface RelatedCase {
  id: string
  title_zh: string
  title_en: string
  caseNumber: string | null
  neutralCitation: string | null
  court: string | null
  judge: string | null
  judgmentDate: Date | null
  category: string | null
  crawledAt: Date
  score: number
}

/**
 * Get related cases for a given public case.
 *
 * Strategy:
 * 1. Fetch source case metadata (category, court, keywords).
 * 2. Query candidates: same category OR same court, excluding self.
 * 3. Score candidates: +2 same category, +2 same court, +1 per shared keyword (max 3).
 * 4. Sort by score desc, then crawledAt desc, return top `limit`.
 * 5. Attempt pgvector cosine similarity as bonus ranking; fall back to keyword strategy on error.
 */
export async function getRelatedCases(publicCaseId: string, limit = 5): Promise<RelatedCase[]> {
  const source = await prisma.publicCase.findUnique({
    where: { id: publicCaseId },
    select: { id: true, category: true, court: true, keywords: true },
  })

  if (!source) return []

  // Try pgvector similarity first
  try {
    const vectorResults = await getRelatedByVector(publicCaseId, limit)
    if (vectorResults.length > 0) return vectorResults
  } catch {
    // pgvector unavailable – fall through to keyword strategy
  }

  return getRelatedByKeywords(source, limit)
}

async function getRelatedByKeywords(
  source: { id: string; category: string | null; court: string | null; keywords: string[] },
  limit: number,
): Promise<RelatedCase[]> {
  const orConditions: any[] = []
  if (source.category) orConditions.push({ category: source.category })
  if (source.court) orConditions.push({ court: { contains: source.court, mode: 'insensitive' } })

  if (orConditions.length === 0) {
    // No category or court to match on – return most recent
    const recent = await prisma.publicCase.findMany({
      where: { id: { not: source.id } },
      take: limit,
      orderBy: { crawledAt: 'desc' },
      select: selectFields,
    })
    return recent.map((c) => ({ ...c, score: 0 }))
  }

  const candidates = await prisma.publicCase.findMany({
    where: { id: { not: source.id }, OR: orConditions },
    take: limit * 3,
    orderBy: { crawledAt: 'desc' },
    select: selectFields,
  })

  const sourceKeywords = new Set(source.keywords.map((k) => k.toLowerCase()))

  const scored = candidates.map((c) => {
    let score = 0
    if (source.category && c.category === source.category) score += 2
    if (source.court && c.court?.toLowerCase().includes(source.court.toLowerCase())) score += 2
    const sharedKeywords = c.keywords.filter((k) => sourceKeywords.has(k.toLowerCase())).length
    score += Math.min(sharedKeywords, 3)
    return { ...c, score }
  })

  return scored.sort((a, b) => b.score - a.score || b.crawledAt.getTime() - a.crawledAt.getTime()).slice(0, limit)
}

/** Attempt pgvector cosine similarity to find related cases. */
async function getRelatedByVector(publicCaseId: string, limit: number): Promise<RelatedCase[]> {
  // Fetch the embedding vector for this case
  const embedding = await prisma.embedding.findFirst({
    where: { publicCaseId, sourceField: 'content' },
    select: { id: true },
  })
  if (!embedding) return []

  // Use pgvector to find nearest neighbours by cosine distance
  const rows = await prisma.$queryRawUnsafe<Array<RelatedCase & { similarity: number }>>(
    `
    SELECT
      pc.id, pc."title_zh", pc."title_en", pc."caseNumber", pc."neutralCitation",
      pc.court, pc.judge, pc."judgmentDate", pc.category, pc."crawledAt",
      (1 - (target.embedding_vector_v <=> source.embedding_vector_v))::float AS similarity
    FROM embeddings source
    JOIN embeddings target ON target."sourceField" = 'content'
      AND target."publicCaseId" != $1
      AND target."embedding_vector_v" IS NOT NULL
    JOIN public_cases pc ON pc.id = target."publicCaseId"
    WHERE source."publicCaseId" = $1
      AND source."sourceField" = 'content'
      AND source."embedding_vector_v" IS NOT NULL
    ORDER BY target.embedding_vector_v <=> source.embedding_vector_v
    LIMIT $2
    `,
    publicCaseId,
    limit,
  )

  return rows.map((r) => ({ ...r, score: Number(r.similarity) }))
}

const selectFields = {
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
  keywords: true,
} as const
