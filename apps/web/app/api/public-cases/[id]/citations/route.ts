import { NextRequest, NextResponse } from 'next/server'
import { getOutgoingCitations, getIncomingCitations, getCitationCounts } from '@/lib/services/citation-service'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  type: z.enum(['outgoing', 'incoming', 'both']).default('both'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid parameters', code: 'VALIDATION_ERROR', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const { type, limit, offset } = parsed.data

    const [outgoing, incoming, counts] = await Promise.all([
      type !== 'incoming' ? getOutgoingCitations(id, { limit, offset }) : Promise.resolve([]),
      type !== 'outgoing' ? getIncomingCitations(id, { limit, offset }) : Promise.resolve([]),
      getCitationCounts(id),
    ])

    return NextResponse.json({
      success: true,
      data: { outgoing, incoming, counts },
    })
  } catch (error: any) {
    console.error('Citations fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}
