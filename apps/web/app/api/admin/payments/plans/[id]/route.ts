/**
 * PUT /api/admin/payments/plans/[id] — update a membership plan's pricing
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('ADMIN')
    const { id } = await params
    const body = await request.json()

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(body.name_zh !== undefined && { name_zh: body.name_zh }),
        ...(body.name_en !== undefined && { name_en: body.name_en }),
        ...(body.description_zh !== undefined && { description_zh: body.description_zh }),
        ...(body.description_en !== undefined && { description_en: body.description_en }),
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.currency !== undefined && { currency: body.currency }),
        ...(body.period !== undefined && { period: body.period }),
        ...(body.searchLimit !== undefined && { searchLimit: body.searchLimit }),
        ...(body.caseLimit !== undefined && { caseLimit: body.caseLimit }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isCustom !== undefined && { isCustom: body.isCustom }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
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
