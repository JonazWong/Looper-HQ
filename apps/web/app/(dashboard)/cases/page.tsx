/**
 * Cases Page - Server Component
 * Fetches and displays all cases from the database
 */

import Link from "next/link"
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  FolderOpen, 
  Plus,
  Eye,
  Edit,
  Archive,
  FileText
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
import { CasesFilters } from "@/components/cases/cases-filters"
import { CasesPagination } from "@/components/cases/cases-pagination"
import { CaseStatus, Priority, CaseCategory } from "@prisma/client"

interface SearchParams {
  search?: string
  status?: string
  priority?: string
  category?: string
  page?: string
}

interface CasesPageProps {
  searchParams: Promise<SearchParams>
}

// Constants
const CASES_PER_PAGE = 10
const UNKNOWN_CLIENT = 'Unknown Client'
const UNKNOWN_LAWYER = 'Unassigned'

// Fetch cases from database
async function getCases(params: SearchParams) {
  try {
    const page = parseInt(params.page || '1')
    const skip = (page - 1) * CASES_PER_PAGE

    // Build where clause
    const where: any = {}

    // Search filter
    if (params.search) {
      where.OR = [
        { caseNumber: { contains: params.search, mode: 'insensitive' } },
        { title: { contains: params.search, mode: 'insensitive' } },
        { client: { name: { contains: params.search, mode: 'insensitive' } } },
      ]
    }

    // Status filter
    if (params.status && Object.values(CaseStatus).includes(params.status as CaseStatus)) {
      where.status = params.status
    }

    // Priority filter
    if (params.priority && Object.values(Priority).includes(params.priority as Priority)) {
      where.priority = params.priority
    }

    // Category filter
    if (params.category && Object.values(CaseCategory).includes(params.category as CaseCategory)) {
      where.category = params.category
    }

    // Fetch cases with pagination
    const [cases, totalCases] = await Promise.all([
      prisma.case.findMany({
        where,
        skip,
        take: CASES_PER_PAGE,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lawyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.case.count({ where }),
    ])

    return {
      cases,
      totalCases,
      currentPage: page,
      totalPages: Math.ceil(totalCases / CASES_PER_PAGE),
    }
  } catch (error) {
    console.error('Error fetching cases:', error)
    return {
      cases: [],
      totalCases: 0,
      currentPage: 1,
      totalPages: 0,
    }
  }
}

// Fetch case statistics
async function getCaseStats() {
  try {
    const [totalCases, activeCases, pendingCases, completedCases] = await Promise.all([
      prisma.case.count(),
      prisma.case.count({ where: { status: 'ACTIVE' } }),
      prisma.case.count({ where: { status: 'PENDING' } }),
      prisma.case.count({ where: { status: 'COMPLETED' } }),
    ])

    return {
      totalCases,
      activeCases,
      pendingCases,
      completedCases,
    }
  } catch (error) {
    console.error('Error fetching case stats:', error)
    return {
      totalCases: 0,
      activeCases: 0,
      pendingCases: 0,
      completedCases: 0,
    }
  }
}

// Format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

// Get status badge color
function getStatusColor(status: CaseStatus): string {
  const colors: Record<CaseStatus, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    COMPLETED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ARCHIVED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

// Get priority badge color
function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    URGENT: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-green-500/20 text-green-400 border-green-500/30',
  }
  return colors[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

// Format category for display
function formatCategory(category: CaseCategory): string {
  return category.replace('_', ' ')
}

export default async function CasesPage({ searchParams }: CasesPageProps) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams
  
  // Fetch data in parallel
  const [{ cases, totalCases, currentPage, totalPages }, stats] = await Promise.all([
    getCases(params),
    getCaseStats(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
            Cases
          </h1>
          <p className="text-premier-pearl-gray">
            Manage and track all your legal cases
          </p>
        </div>
        <Link href="/cases/new">
          <PremierButton variant="primary" icon={Plus}>
            New Case
          </PremierButton>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cases"
          value={stats.totalCases}
          icon={Briefcase}
        />
        <StatCard
          title="Active Cases"
          value={stats.activeCases}
          icon={FolderOpen}
        />
        <StatCard
          title="Pending Cases"
          value={stats.pendingCases}
          icon={Clock}
        />
        <StatCard
          title="Completed Cases"
          value={stats.completedCases}
          icon={CheckCircle2}
        />
      </div>

      {/* Filters */}
      <GlassCard variant="default">
        <GlassCardContent className="pt-6">
          <CasesFilters
            initialSearch={params.search}
            initialStatus={params.status}
            initialPriority={params.priority}
            initialCategory={params.category}
          />
        </GlassCardContent>
      </GlassCard>

      {/* Cases Table */}
      <GlassCard variant="gold" glow>
        <GlassCardHeader>
          <GlassCardTitle>All Cases</GlassCardTitle>
          <GlassCardDescription>
            {totalCases === 0 
              ? 'No cases found' 
              : `${totalCases} case${totalCases === 1 ? '' : 's'} in the system`
            }
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-premier-pearl-gray mb-4" />
              <h3 className="text-lg font-medium text-premier-pearl mb-2">
                No cases found
              </h3>
              <p className="text-sm text-premier-pearl-gray mb-6 text-center max-w-md">
                {params.search || params.status || params.priority || params.category
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Get started by creating your first case.'}
              </p>
              <Link href="/cases/new">
                <PremierButton variant="primary" icon={Plus}>
                  Create New Case
                </PremierButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-premier-gold/20">
                      <TableHead className="text-premier-gold">Case Number</TableHead>
                      <TableHead className="text-premier-gold">Title</TableHead>
                      <TableHead className="text-premier-gold">Client</TableHead>
                      <TableHead className="text-premier-gold">Lawyer</TableHead>
                      <TableHead className="text-premier-gold">Category</TableHead>
                      <TableHead className="text-premier-gold">Status</TableHead>
                      <TableHead className="text-premier-gold">Priority</TableHead>
                      <TableHead className="text-premier-gold">Created</TableHead>
                      <TableHead className="text-premier-gold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((case_) => (
                      <TableRow 
                        key={case_.id} 
                        className="border-premier-gold/10 hover:bg-premier-gold/5 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/cases/${case_.id}`}
                            className="text-premier-gold hover:underline"
                          >
                            {case_.caseNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-premier-pearl">
                          {case_.title}
                        </TableCell>
                        <TableCell className="text-premier-pearl-gray">
                          {case_.client.name || UNKNOWN_CLIENT}
                        </TableCell>
                        <TableCell className="text-premier-pearl-gray">
                          {case_.lawyer?.name || UNKNOWN_LAWYER}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="bg-premier-mystery-violet/20 text-premier-mystery-violet border-premier-mystery-violet/30"
                          >
                            {formatCategory(case_.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(case_.status)}
                          >
                            {case_.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(case_.priority)}
                          >
                            {case_.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-premier-pearl-gray">
                          {formatDate(case_.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/cases/${case_.id}`}>
                              <PremierButton 
                                variant="ghost" 
                                size="icon" 
                                icon={Eye}
                              />
                            </Link>
                            <Link href={`/cases/${case_.id}/edit`}>
                              <PremierButton 
                                variant="ghost" 
                                size="icon" 
                                icon={Edit}
                              />
                            </Link>
                            <PremierButton 
                              variant="ghost" 
                              size="icon" 
                              icon={Archive}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <CasesPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCases={totalCases}
                casesPerPage={CASES_PER_PAGE}
              />
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
