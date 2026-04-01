/**
 * GET  /api/admin/payments/plans — list all plans (including inactive)
 * POST /api/admin/payments/plans — create or upsert a plan
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/errors'

export async function GET() {
  try {
    await requireRole('ADMIN')

    const plans = await prisma.membershipPlan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { payments: { where: { status: 'SUCCEEDED' } } } },
      },
    })

    return NextResponse.json({
      success: true,
      data: plans.map((p) => ({
        ...p,
        amount: p.amount !== null ? Number(p.amount) : null,
        succeededPayments: p._count.payments,
      })),
    })
  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json(
      { success: false, error: { message } },
      { status: statusCode }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN')
    const body = await request.json()

    const plan = await prisma.membershipPlan.upsert({
      where: { tier: body.tier },
      update: {
        name_zh: body.name_zh,
        name_en: body.name_en,
        description_zh: body.description_zh,
        description_en: body.description_en,
        amount: body.amount ?? null,
        currency: body.currency ?? 'HKD',
        period: body.period ?? 'monthly',
        searchLimit: body.searchLimit ?? 10,
        caseLimit: body.caseLimit ?? null,
        isActive: body.isActive ?? true,
        isCustom: body.isCustom ?? false,
        sortOrder: body.sortOrder ?? 0,
      },
      create: {
        tier: body.tier,
        name_zh: body.name_zh,
        name_en: body.name_en,
        description_zh: body.description_zh,
        description_en: body.description_en,
        amount: body.amount ?? null,
        currency: body.currency ?? 'HKD',
        period: body.period ?? 'monthly',
        searchLimit: body.searchLimit ?? 10,
        caseLimit: body.caseLimit ?? null,
        isActive: body.isActive ?? true,
        isCustom: body.isCustom ?? false,
        sortOrder: body.sortOrder ?? 0,
      },
    })

    return NextResponse.json({
      success: true,
      data: { ...plan, amount: plan.amount !== null ? Number(plan.amount) : null },
    })
  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json(
      { success: false, error: { message } },
      { status: statusCode }
    )
  }
}
