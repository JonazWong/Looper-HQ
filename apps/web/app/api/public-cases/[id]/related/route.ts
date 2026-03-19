import { NextRequest, NextResponse } from 'next/server'
import { getRelatedCases } from '@/lib/services/recommendations'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(20).default(5),
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

    const { limit } = parsed.data
    const related = await getRelatedCases(id, limit)

    return NextResponse.json({ success: true, data: related })
  } catch (error: any) {
    console.error('Related cases error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}
