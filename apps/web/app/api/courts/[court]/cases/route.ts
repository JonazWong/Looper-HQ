import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['crawledAt', 'judgmentDate']).default('crawledAt'),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ court: string }> },
) {
  try {
    const { court } = await params
    const courtName = decodeURIComponent(court)
    const { searchParams } = new URL(request.url)

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid parameters', code: 'VALIDATION_ERROR', details: parsed.error.issues } },
        { status: 400 },
      )
    }

    const { page, limit, sort } = parsed.data
    const skip = (page - 1) * limit

    const where = { court: { contains: courtName, mode: 'insensitive' as const } }

    const [cases, total] = await Promise.all([
      prisma.publicCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: 'desc' },
        select: {
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
          sourceUrl: true,
        },
      }),
      prisma.publicCase.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        court: courtName,
        cases,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error: any) {
    console.error('Court cases error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}
