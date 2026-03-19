/**
 * Citation Extraction Script
 * Extracts HK case numbers and neutral citations from PublicCase text fields
 * and upserts them into the CaseCitation table.
 *
 * Usage: npx ts-node --project tsconfig.json scripts/citations/extract-citations.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Inline regex patterns (avoid importing from apps/web) ──────────────────────

/** Standard HK case number: e.g. HCAL 123/2024 */
const CASE_NUMBER_PATTERN = /\b([A-Z]{2,6})\s*(\d+)\/(\d{4})\b/g

/** Known HK court codes that appear in standard case numbers */
const KNOWN_COURT_CODES = new Set([
  'FACV', 'FACC', 'FAMV',
  'HCAL', 'HCMA', 'HCLA', 'HCPI', 'HCA', 'HCCT', 'HCCL', 'HCCW', 'HCMP', 'HCSD',
  'DCCC', 'DCCJ', 'DCEO', 'DCEC', 'DCPI', 'DCCV',
  'ESCC', 'FLCC', 'KCCC', 'KTCC', 'KWCC', 'STTC', 'STCC', 'TMCC', 'WKCC',
])

/** HK neutral citation: e.g. [2024] HKCFA 1 */
const NEUTRAL_CITATION_PATTERN = /\[(\d{4})\]\s+(HKCFA|HKCA|HKCFI|HKDC)\s+(\d+)/g

interface ExtractedRef {
  type: 'caseNumber' | 'neutralCitation'
  raw: string
}

// Cache resolved PublicCase IDs by raw reference to avoid N+1 lookups
const caseNumberResolutionCache = new Map<string, string | null>()
const neutralCitationResolutionCache = new Map<string, string | null>()

function extractRefs(text: string): ExtractedRef[] {
  const refs: ExtractedRef[] = []
  const seen = new Set<string>()

  // Standard case numbers – create a fresh regex instance per call to reset lastIndex
  for (const match of text.matchAll(new RegExp(CASE_NUMBER_PATTERN.source, 'g'))) {
    const [fullNumber, courtCode, sequence, year] = match
    if (!KNOWN_COURT_CODES.has(courtCode)) continue
    const normalizedNumber = `${courtCode} ${sequence}/${year}`
    if (!seen.has(normalizedNumber)) {
      seen.add(normalizedNumber)
      refs.push({ type: 'caseNumber', raw: normalizedNumber })
    }
  }

  // Neutral citations – fresh regex instance per call
  for (const match of text.matchAll(new RegExp(NEUTRAL_CITATION_PATTERN.source, 'g'))) {
    const [fullCitation] = match
    if (!seen.has(fullCitation)) {
      seen.add(fullCitation)
      refs.push({ type: 'neutralCitation', raw: fullCitation })
    }
  }

  return refs
}

async function main() {
  console.log('🔍 Citation extraction started…')

  const cases = await prisma.publicCase.findMany({
    where: {
      OR: [
        { fullText: { not: null } },
        { judgment_zh: { not: null } },
        { judgment_en: { not: null } },
      ],
    },
    select: {
      id: true,
      caseNumber: true,
      neutralCitation: true,
      fullText: true,
      judgment_zh: true,
      judgment_en: true,
    },
  })

  console.log(`📋 Processing ${cases.length} cases with text content…`)

  let totalCreated = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const sourceCase of cases) {
    const texts = [
      sourceCase.fullText,
      sourceCase.judgment_zh,
      sourceCase.judgment_en,
    ].filter(Boolean) as string[]

    const allRefs: ExtractedRef[] = []
    for (const text of texts) {
      allRefs.push(...extractRefs(text))
    }

    // Deduplicate across fields
    const uniqueRefs = Array.from(new Map(allRefs.map((r) => [r.raw, r])).values())

    for (const ref of uniqueRefs) {
      try {
        // Skip self-references
        if (
          ref.raw === sourceCase.caseNumber ||
          ref.raw === sourceCase.neutralCitation
        ) {
          totalSkipped++
          continue
        }

        // Try to resolve to a PublicCase
        let resolvedId: string | null = null

        if (ref.type === 'caseNumber') {
          const cached = caseNumberResolutionCache.get(ref.raw)
          if (cached !== undefined) {
            resolvedId = cached
          } else {
            const match = await prisma.publicCase.findFirst({
              where: { caseNumber: ref.raw },
              select: { id: true },
            })
            resolvedId = match?.id ?? null
            caseNumberResolutionCache.set(ref.raw, resolvedId)
          }
        } else {
          const cached = neutralCitationResolutionCache.get(ref.raw)
          if (cached !== undefined) {
            resolvedId = cached
          } else {
            const match = await prisma.publicCase.findFirst({
              where: { neutralCitation: ref.raw },
              select: { id: true },
            })
            resolvedId = match?.id ?? null
            neutralCitationResolutionCache.set(ref.raw, resolvedId)
          }
        }

        if (resolvedId) {
          // Resolved citation – upsert with citedCaseId
          await prisma.caseCitation.upsert({
            where: {
              citingCaseId_citedCaseId: {
                citingCaseId: sourceCase.id,
                citedCaseId: resolvedId,
              },
            },
            create: {
              citingCaseId: sourceCase.id,
              citedCaseId: resolvedId,
              citationText: ref.raw,
            },
            update: { citationText: ref.raw },
          })
        } else {
          // Unresolved citation – store as externalRef
          await prisma.caseCitation.upsert({
            where: {
              citingCaseId_externalRef: {
                citingCaseId: sourceCase.id,
                externalRef: ref.raw,
              },
            },
            create: {
              citingCaseId: sourceCase.id,
              citedCaseId: null,
              externalRef: ref.raw,
              citationText: ref.raw,
            },
            update: {},
          })
        }

        totalCreated++
      } catch (err: any) {
        console.error(`  ✗ Error processing ref "${ref.raw}" for case ${sourceCase.id}: ${err.message}`)
        totalErrors++
      }
    }
  }

  console.log('\n✅ Extraction complete:')
  console.log(`   Created/updated: ${totalCreated}`)
  console.log(`   Skipped (self):  ${totalSkipped}`)
  console.log(`   Errors:          ${totalErrors}`)

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
