import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const publicCase = await prisma.publicCase.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            citingCases: true,
            citedByCases: true,
          },
        },
      },
    })

    if (!publicCase) {
      return NextResponse.json(
        { success: false, error: { message: 'Not found', code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: publicCase })
  } catch (error: any) {
    console.error('Public case detail error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}
