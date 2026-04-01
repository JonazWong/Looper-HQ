/**
 * GET /api/admin/payments
 * Admin only — list all payment records with pagination and filters.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN')

    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const perPage = Math.min(100, parseInt(searchParams.get('perPage') ?? '20'))
    const status = searchParams.get('status') ?? undefined
    const skip = (page - 1) * perPage

    const where = status ? { status: status as never } : {}

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, membershipTier: true } },
          plan: { select: { tier: true, name_zh: true, name_en: true } },
        },
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json(
      { success: false, error: { message } },
      { status: statusCode }
    )
  }
}
