/**
 * GET /api/payments/plans
 * Public endpoint — returns all active membership plans with pricing.
 * No authentication required (used by the homepage pricing section).
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        tier: true,
        name_zh: true,
        name_en: true,
        description_zh: true,
        description_en: true,
        amount: true,
        currency: true,
        period: true,
        searchLimit: true,
        caseLimit: true,
        isCustom: true,
        sortOrder: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: plans.map((p) => ({
        ...p,
        amount: p.amount !== null ? Number(p.amount) : null,
      })),
    })
  } catch (error) {
    console.error('[payments/plans] Error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch plans' } },
      { status: 500 }
    )
  }
}
