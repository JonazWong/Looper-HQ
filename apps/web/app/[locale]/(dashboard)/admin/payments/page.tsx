/**
 * Admin Payments Management Page
 * Lists all payment records and allows editing plan pricing + manual intent creation.
 */
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AdminPaymentsClient } from './admin-payments-client'

export default async function AdminPaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect(`/${locale}/dashboard`)
  }

  const resolvedSearch = await searchParams
  const page = Math.max(1, parseInt(resolvedSearch.page ?? '1'))
  const status = resolvedSearch.status
  const perPage = 20
  const skip = (page - 1) * perPage

  const where = status ? { status: status as never } : {}

  const [payments, total, plans, stats] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, membershipTier: true } },
        plan: { select: { tier: true, name_zh: true } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.membershipPlan.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.payment.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ])

  const statsMap = Object.fromEntries(
    stats.map((s) => [s.status, { count: s._count._all, total: Number(s._sum.amount ?? 0) }])
  )

  return (
    <AdminPaymentsClient
      payments={payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
      plans={plans.map((p) => ({
        ...p,
        amount: p.amount !== null ? Number(p.amount) : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
      total={total}
      page={page}
      perPage={perPage}
      currentStatus={status}
      stats={statsMap}
      locale={locale}
    />
  )
}
