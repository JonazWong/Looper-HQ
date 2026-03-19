/**
 * Citation Service
 * Provides functions to query CaseCitation edges stored in the database.
 *
 * CaseCitation edges were introduced in Phase 1 (HKLII crawler) and hold
 * directed citation relationships: A cites B ⟹ A.citingCaseId → B.citedCaseId.
 *
 * Phase 2B adds this service layer so that API routes and UI components can
 * fetch outgoing/incoming citations without duplicating query logic.
 */

import { prisma } from '@/lib/db'

export interface CitationEdge {
  id: string
  citationText: string | null
  context: string | null
  externalRef: string | null
  createdAt: Date
  relatedCase: {
    id: string
    title_zh: string
    title_en: string
    caseNumber: string | null
    neutralCitation: string | null
    court: string | null
    judgmentDate: Date | null
    source: string
    sourceUrl: string | null
  } | null
}

/**
 * Return the cases that `publicCaseId` cites (outgoing citations).
 *
 * e.g. for case A: "A cited these cases"
 */
export async function getOutgoingCitations(
  publicCaseId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<CitationEdge[]> {
  const { limit = 50, offset = 0 } = options

  const edges = await prisma.caseCitation.findMany({
    where: { citingCaseId: publicCaseId },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
    include: {
      citedCase: {
        select: {
          id: true,
          title_zh: true,
          title_en: true,
          caseNumber: true,
          neutralCitation: true,
          court: true,
          judgmentDate: true,
          source: true,
          sourceUrl: true,
        },
      },
    },
  })

  return edges.map((e) => ({
    id: e.id,
    citationText: e.citationText,
    context: e.context,
    externalRef: e.externalRef,
    createdAt: e.createdAt,
    relatedCase: e.citedCase ?? null,
  }))
}

/**
 * Return the cases that cite `publicCaseId` (incoming citations).
 *
 * e.g. for case B: "These cases cited B"
 */
export async function getIncomingCitations(
  publicCaseId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<CitationEdge[]> {
  const { limit = 50, offset = 0 } = options

  const edges = await prisma.caseCitation.findMany({
    where: { citedCaseId: publicCaseId },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
    include: {
      citingCase: {
        select: {
          id: true,
          title_zh: true,
          title_en: true,
          caseNumber: true,
          neutralCitation: true,
          court: true,
          judgmentDate: true,
          source: true,
          sourceUrl: true,
        },
      },
    },
  })

  return edges.map((e) => ({
    id: e.id,
    citationText: e.citationText,
    context: e.context,
    externalRef: e.externalRef,
    createdAt: e.createdAt,
    relatedCase: e.citingCase,
  }))
}

/**
 * Count outgoing and incoming citations for a case in a single query.
 * Useful for displaying badge counts without fetching full edge lists.
 */
export async function getCitationCounts(
  publicCaseId: string,
): Promise<{ outgoing: number; incoming: number }> {
  const [outgoing, incoming] = await Promise.all([
    prisma.caseCitation.count({ where: { citingCaseId: publicCaseId } }),
    prisma.caseCitation.count({ where: { citedCaseId: publicCaseId } }),
  ])

  return { outgoing, incoming }
}
