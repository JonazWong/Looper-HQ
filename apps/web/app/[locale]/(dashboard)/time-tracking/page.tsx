/**
 * Time Tracking Page - Server Component
 * Displays time logs with filtering, summary, and add functionality
 */

import Link from "next/link"
import { 
  Clock, 
  DollarSign, 
  Plus,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Calendar
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
import { Input } from "@/components/ui/input"
import { formatHKDate } from "@/lib/utils"

interface SearchParams {
  caseId?: string
  billable?: string
  startDate?: string
  endDate?: string
  page?: string
}

interface TimeTrackingPageProps {
  searchParams: Promise<SearchParams>
}

// Constants
const LOGS_PER_PAGE = 20

// Fetch time logs
async function getTimeLogs(params: SearchParams) {
  try {
    const page = parseInt(params.page || '1')
    const skip = (page - 1) * LOGS_PER_PAGE

    // Build where clause
    const where: any = {}

    // Case filter
    if (params.caseId) {
      where.caseId = params.caseId
    }

    // Billable filter
    if (params.billable === 'true') {
      where.billable = true
    } else if (params.billable === 'false') {
      where.billable = false
    }

    // Date range filter
    if (params.startDate || params.endDate) {
      where.logDate = {}
      if (params.startDate) {
        where.logDate.gte = new Date(params.startDate)
      }
      if (params.endDate) {
        where.logDate.lte = new Date(params.endDate)
      }
    }

    const [timeLogs, totalLogs] = await Promise.all([
      prisma.timeLog.findMany({
        where,
        skip,
        take: LOGS_PER_PAGE,
        orderBy: {
          logDate: 'desc',
        },
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              client: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.timeLog.count({ where }),
    ])

    return {
      timeLogs,
      totalLogs,
      currentPage: page,
      totalPages: Math.ceil(totalLogs / LOGS_PER_PAGE),
    }
  } catch (error) {
    console.error('Error fetching time logs:', error)
    return {
      timeLogs: [],
      totalLogs: 0,
      currentPage: 1,
      totalPages: 0,
    }
  }
}

// Fetch time tracking statistics
async function getTimeTrackingStats(params: SearchParams) {
  try {
    // Build where clause for stats (same as logs)
    const where: any = {}
    if (params.caseId) where.caseId = params.caseId
    if (params.billable === 'true') where.billable = true
    else if (params.billable === 'false') where.billable = false
    if (params.startDate || params.endDate) {
      where.logDate = {}
      if (params.startDate) where.logDate.gte = new Date(params.startDate)
      if (params.endDate) where.logDate.lte = new Date(params.endDate)
    }

    const [
      totalLogs,
      billableLogs,
      nonBillableLogs,
      totalHours,
      billableHours,
      billableTimeLogs,
    ] = await Promise.all([
      prisma.timeLog.count({ where }),
      prisma.timeLog.count({ where: { ...where, billable: true } }),
      prisma.timeLog.count({ where: { ...where, billable: false } }),
      prisma.timeLog.aggregate({
        where,
        _sum: { hours: true },
      }),
      prisma.timeLog.aggregate({
        where: { ...where, billable: true },
        _sum: { hours: true },
      }),
      prisma.timeLog.findMany({
        where: { 
          ...where, 
          billable: true,
          hourlyRate: { not: null }
        },
        select: {
          hours: true,
          hourlyRate: true,
        },
      }),
    ])

    // Calculate total revenue from billable time logs
    const totalRevenue = billableTimeLogs.reduce((sum, log) => {
      return sum + (Number(log.hours) * Number(log.hourlyRate))
    }, 0)

    return {
      totalLogs,
      billableLogs,
      nonBillableLogs,
      totalHours: Number(totalHours._sum.hours || 0),
      billableHours: Number(billableHours._sum.hours || 0),
      totalRevenue,
    }
  } catch (error) {
    console.error('Error fetching time tracking stats:', error)
    return {
      totalLogs: 0,
      billableLogs: 0,
      nonBillableLogs: 0,
      totalHours: 0,
      billableHours: 0,
      totalRevenue: 0,
    }
  }
}

// Fetch cases for filter dropdown
async function getCasesForFilter() {
  try {
    const cases = await prisma.case.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'PENDING'],
        },
      },
      select: {
        id: true,
        caseNumber: true,
        title: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })
    return cases
  } catch (error) {
    console.error('Error fetching cases:', error)
    return []
  }
}

export default async function TimeTrackingPage({ searchParams }: TimeTrackingPageProps) {
  const params = await searchParams
  
  const [{ timeLogs, totalLogs, currentPage, totalPages }, stats, cases] = await Promise.all([
    getTimeLogs(params),
    getTimeTrackingStats(params),
    getCasesForFilter(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
            Time Tracking
          </h1>
          <p className="text-premier-pearl-gray">
            Track billable hours and manage time logs
          </p>
        </div>
        <PremierButton variant="primary" icon={Plus}>
          Add Time Log
        </PremierButton>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Hours"
          value={stats.totalHours.toFixed(2)}
          icon={Clock}
        />
        <StatCard
          title="Billable Hours"
          value={stats.billableHours.toFixed(2)}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Total Revenue"
          value={`HKD ${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Time Entries"
          value={stats.totalLogs}
          icon={Calendar}
        />
      </div>

      {/* Filters */}
      <GlassCard variant="default">
        <GlassCardContent className="pt-6">
          <form action="/time-tracking" method="get" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Case Filter */}
              <div className="space-y-2">
                <label className="text-sm text-premier-pearl">Case</label>
                <select
                  name="caseId"
                  defaultValue={params.caseId || ''}
                  className="w-full px-3 py-2 bg-premier-charcoal/50 border border-premier-gold/30 rounded-md text-premier-pearl text-sm focus:outline-none focus:ring-2 focus:ring-premier-gold"
                >
                  <option value="">All Cases</option>
                  {cases.map((case_) => (
                    <option key={case_.id} value={case_.id}>
                      {case_.caseNumber} - {case_.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Billable Filter */}
              <div className="space-y-2">
                <label className="text-sm text-premier-pearl">Billable</label>
                <select
                  name="billable"
                  defaultValue={params.billable || ''}
                  className="w-full px-3 py-2 bg-premier-charcoal/50 border border-premier-gold/30 rounded-md text-premier-pearl text-sm focus:outline-none focus:ring-2 focus:ring-premier-gold"
                >
                  <option value="">All</option>
                  <option value="true">Billable Only</option>
                  <option value="false">Non-billable Only</option>
                </select>
              </div>

              {/* Start Date Filter */}
              <div className="space-y-2">
                <label className="text-sm text-premier-pearl">Start Date</label>
                <Input
                  type="date"
                  name="startDate"
                  defaultValue={params.startDate}
                  className="bg-premier-charcoal/50 border-premier-gold/30 text-premier-pearl text-sm"
                />
              </div>

              {/* End Date Filter */}
              <div className="space-y-2">
                <label className="text-sm text-premier-pearl">End Date</label>
                <Input
                  type="date"
                  name="endDate"
                  defaultValue={params.endDate}
                  className="bg-premier-charcoal/50 border-premier-gold/30 text-premier-pearl text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <PremierButton type="submit" variant="primary" icon={Filter} size="sm">
                Apply Filters
              </PremierButton>
              <Link href="/time-tracking">
                <PremierButton type="button" variant="ghost" size="sm">
                  Clear Filters
                </PremierButton>
              </Link>
              <PremierButton type="button" variant="ghost" icon={Download} size="sm">
                Export
              </PremierButton>
            </div>
          </form>
        </GlassCardContent>
      </GlassCard>

      {/* Time Logs Table */}
      <GlassCard variant="gold" glow>
        <GlassCardHeader>
          <GlassCardTitle>Time Logs</GlassCardTitle>
          <GlassCardDescription>
            {totalLogs === 0 
              ? 'No time logs found' 
              : `${totalLogs} time log${totalLogs === 1 ? '' : 's'} • ${stats.billableHours.toFixed(2)} billable hrs • HKD ${stats.totalRevenue.toLocaleString()}`
            }
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {timeLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-premier-pearl-gray mb-4" />
              <h3 className="text-lg font-medium text-premier-pearl mb-2">
                No time logs found
              </h3>
              <p className="text-sm text-premier-pearl-gray mb-6 text-center max-w-md">
                {params.caseId || params.billable || params.startDate || params.endDate
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Get started by adding your first time log.'}
              </p>
              <PremierButton variant="primary" icon={Plus}>
                Add Time Log
              </PremierButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-premier-gold/20">
                      <TableHead className="text-premier-gold">Date</TableHead>
                      <TableHead className="text-premier-gold">Case</TableHead>
                      <TableHead className="text-premier-gold">Description</TableHead>
                      <TableHead className="text-premier-gold">Hours</TableHead>
                      <TableHead className="text-premier-gold">Rate</TableHead>
                      <TableHead className="text-premier-gold">Amount</TableHead>
                      <TableHead className="text-premier-gold">Billable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeLogs.map((log) => {
                      const amount = log.hourlyRate 
                        ? Number(log.hours) * Number(log.hourlyRate)
                        : null
                      
                      return (
                        <TableRow 
                          key={log.id} 
                          className="border-premier-gold/10 hover:bg-premier-gold/5 transition-colors"
                        >
                          <TableCell className="font-medium text-premier-pearl">
                            {formatHKDate(log.logDate)}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/cases/${log.case.id}`}
                              className="text-premier-gold hover:underline"
                            >
                              {log.case.caseNumber}
                            </Link>
                            <p className="text-xs text-premier-pearl-gray mt-1 max-w-xs truncate">
                              {log.case.client.name || 'Unknown Client'}
                            </p>
                          </TableCell>
                          <TableCell className="text-premier-pearl max-w-md">
                            <p className="truncate">{log.description}</p>
                          </TableCell>
                          <TableCell className="text-premier-pearl font-medium">
                            {Number(log.hours).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-premier-pearl-gray">
                            {log.hourlyRate 
                              ? `HKD ${Number(log.hourlyRate).toLocaleString()}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-premier-gold font-medium">
                            {amount !== null && log.billable
                              ? `HKD ${amount.toLocaleString()}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={log.billable 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                              }
                            >
                              {log.billable ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Billable
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Non-billable
                                </span>
                              )}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Row */}
              <div className="border-t border-premier-gold/20 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-premier-pearl-gray">Total Hours</p>
                    <p className="text-lg font-bold text-premier-pearl">
                      {timeLogs.reduce((sum, log) => sum + Number(log.hours), 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-premier-pearl-gray">Billable Hours</p>
                    <p className="text-lg font-bold text-premier-gold">
                      {timeLogs
                        .filter(log => log.billable)
                        .reduce((sum, log) => sum + Number(log.hours), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-premier-pearl-gray">Total Amount</p>
                    <p className="text-lg font-bold text-premier-gold">
                      HKD {timeLogs
                        .filter(log => log.billable && log.hourlyRate)
                        .reduce((sum, log) => sum + (Number(log.hours) * Number(log.hourlyRate)), 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-premier-pearl-gray">Entries</p>
                    <p className="text-lg font-bold text-premier-pearl">
                      {timeLogs.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-premier-pearl-gray">
                    Showing {((currentPage - 1) * LOGS_PER_PAGE) + 1} to{' '}
                    {Math.min(currentPage * LOGS_PER_PAGE, totalLogs)} of{' '}
                    {totalLogs} logs
                  </p>
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <Link href={`/time-tracking?${new URLSearchParams({ ...params, page: String(currentPage - 1) })}`}>
                        <PremierButton variant="ghost" size="sm">
                          Previous
                        </PremierButton>
                      </Link>
                    )}
                    {currentPage < totalPages && (
                      <Link href={`/time-tracking?${new URLSearchParams({ ...params, page: String(currentPage + 1) })}`}>
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
