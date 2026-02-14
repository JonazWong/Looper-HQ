/**
 * Billing Page - Server Component
 * Displays invoice management and payment tracking
 */

import Link from "next/link"
import { 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Download,
  Eye
} from "lucide-react"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { PremierButton } from "@/components/ui/premier-button"
import { StatCard } from "@/components/ui/stat-card"
import { 
  GlassCard, 
  GlassCardHeader, 
  GlassCardTitle, 
  GlassCardDescription, 
  GlassCardContent 
} from "@/components/ui/glass-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InvoiceStatus } from "@prisma/client"
import { formatHKDate } from "@/lib/utils"

interface SearchParams {
  status?: string
  page?: string
}

interface BillingPageProps {
  searchParams: Promise<SearchParams>
}

// Constants
const INVOICES_PER_PAGE = 10

// Fetch invoices
async function getInvoices(params: SearchParams) {
  try {
    const page = parseInt(params.page || '1')
    const skip = (page - 1) * INVOICES_PER_PAGE

    // Build where clause
    const where: any = {}
    if (params.status && Object.values(InvoiceStatus).includes(params.status as InvoiceStatus)) {
      where.status = params.status
    }

    const [invoices, totalInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: INVOICES_PER_PAGE,
        orderBy: {
          issueDate: 'desc',
        },
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              title_zh: true,
              title_en: true,
              client: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ])

    return {
      invoices,
      totalInvoices,
      currentPage: page,
      totalPages: Math.ceil(totalInvoices / INVOICES_PER_PAGE),
    }
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return {
      invoices: [],
      totalInvoices: 0,
      currentPage: 1,
      totalPages: 0,
    }
  }
}

// Fetch billing statistics
async function getBillingStats() {
  try {
    const [
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue,
      pendingRevenue,
    ] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ['PENDING', 'OVERDUE'] } },
        _sum: { amount: true },
      }),
    ])

    return {
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      pendingRevenue: Number(pendingRevenue._sum.amount || 0),
    }
  } catch (error) {
    console.error('Error fetching billing stats:', error)
    return {
      totalInvoices: 0,
      pendingInvoices: 0,
      paidInvoices: 0,
      overdueInvoices: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
    }
  }
}

// Get status badge color
function getStatusColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PAID: 'bg-green-500/20 text-green-400 border-green-500/30',
    OVERDUE: 'bg-red-500/20 text-red-400 border-red-500/30',
    CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

// Check if invoice is overdue
function isOverdue(dueDate: Date, status: InvoiceStatus): boolean {
  return status === 'PENDING' && new Date(dueDate) < new Date()
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams
  
  const [{ invoices, totalInvoices, currentPage, totalPages }, stats] = await Promise.all([
    getInvoices(params),
    getBillingStats(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
            Billing & Invoices
          </h1>
          <p className="text-premier-pearl-gray">
            Manage invoices and track payments
          </p>
        </div>
        <Link href="/billing/new">
          <PremierButton variant="primary" icon={Plus}>
            New Invoice
          </PremierButton>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`HKD ${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Pending Amount"
          value={`HKD ${stats.pendingRevenue.toLocaleString()}`}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Paid Invoices"
          value={stats.paidInvoices}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Overdue Invoices"
          value={stats.overdueInvoices}
          icon={AlertCircle}
          variant="danger"
        />
      </div>

      {/* Status Filters */}
      <GlassCard variant="default">
        <GlassCardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Link href="/billing">
              <Badge 
                variant="outline"
                className={!params.status 
                  ? 'bg-premier-gold/20 text-premier-gold border-premier-gold/40'
                  : 'bg-premier-charcoal/50 text-premier-pearl-gray border-premier-gold/20 hover:bg-premier-gold/10 cursor-pointer'
                }
              >
                All ({stats.totalInvoices})
              </Badge>
            </Link>
            {Object.values(InvoiceStatus).map((status) => (
              <Link key={status} href={`/billing?status=${status}`}>
                <Badge 
                  variant="outline"
                  className={params.status === status
                    ? 'bg-premier-gold/20 text-premier-gold border-premier-gold/40'
                    : 'bg-premier-charcoal/50 text-premier-pearl-gray border-premier-gold/20 hover:bg-premier-gold/10 cursor-pointer'
                  }
                >
                  {status}
                </Badge>
              </Link>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Invoices Table */}
      <GlassCard variant="gold" glow>
        <GlassCardHeader>
          <GlassCardTitle>Invoices</GlassCardTitle>
          <GlassCardDescription>
            {totalInvoices === 0 
              ? 'No invoices found' 
              : `${totalInvoices} invoice${totalInvoices === 1 ? '' : 's'} in the system`
            }
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-premier-pearl-gray mb-4" />
              <h3 className="text-lg font-medium text-premier-pearl mb-2">
                No invoices found
              </h3>
              <p className="text-sm text-premier-pearl-gray mb-6 text-center max-w-md">
                {params.status
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Get started by creating your first invoice.'}
              </p>
              <Link href="/billing/new">
                <PremierButton variant="primary" icon={Plus}>
                  Create Invoice
                </PremierButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-premier-gold/20">
                      <TableHead className="text-premier-gold">Invoice #</TableHead>
                      <TableHead className="text-premier-gold">Case</TableHead>
                      <TableHead className="text-premier-gold">Client</TableHead>
                      <TableHead className="text-premier-gold">Amount</TableHead>
                      <TableHead className="text-premier-gold">Status</TableHead>
                      <TableHead className="text-premier-gold">Issue Date</TableHead>
                      <TableHead className="text-premier-gold">Due Date</TableHead>
                      <TableHead className="text-premier-gold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const overdue = isOverdue(invoice.dueDate, invoice.status)
                      return (
                        <TableRow 
                          key={invoice.id} 
                          className="border-premier-gold/10 hover:bg-premier-gold/5 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <Link
                              href={`/billing/${invoice.id}`}
                              className="text-premier-gold hover:underline"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/cases/${invoice.case.id}`}
                              className="text-premier-pearl hover:underline"
                            >
                              {invoice.case.caseNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="text-premier-pearl-gray">
                            {invoice.case.client.name || 'Unknown Client'}
                          </TableCell>
                          <TableCell className="text-premier-pearl font-medium">
                            {invoice.currency} {Number(invoice.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(overdue ? 'OVERDUE' : invoice.status)}
                            >
                              {overdue ? 'OVERDUE' : invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-premier-pearl-gray">
                            {formatHKDate(invoice.issueDate)}
                          </TableCell>
                          <TableCell className={overdue ? 'text-red-400 font-medium' : 'text-premier-pearl-gray'}>
                            {formatHKDate(invoice.dueDate)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/billing/${invoice.id}`}>
                                <PremierButton 
                                  variant="ghost" 
                                  size="icon" 
                                  icon={Eye}
                                />
                              </Link>
                              <PremierButton 
                                variant="ghost" 
                                size="icon" 
                                icon={Download}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-premier-pearl-gray">
                    Showing {((currentPage - 1) * INVOICES_PER_PAGE) + 1} to{' '}
                    {Math.min(currentPage * INVOICES_PER_PAGE, totalInvoices)} of{' '}
                    {totalInvoices} invoices
                  </p>
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <Link href={`/billing?${new URLSearchParams({ ...params, page: String(currentPage - 1) })}`}>
                        <PremierButton variant="ghost" size="sm">
                          Previous
                        </PremierButton>
                      </Link>
                    )}
                    {currentPage < totalPages && (
                      <Link href={`/billing?${new URLSearchParams({ ...params, page: String(currentPage + 1) })}`}>
                        <PremierButton variant="ghost" size="sm">
                          Next
                        </PremierButton>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
