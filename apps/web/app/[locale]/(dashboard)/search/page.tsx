/**
 * Public Case Search Page - Server Component
 * Allows searching for public cases with filters and logging
 */

import { headers } from 'next/headers'
import { 
  Search as SearchIcon,
  FileText,
  Calendar,
  AlertCircle,
  Scale
} from "lucide-react"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { getLocalizedField } from '@looper-hq/utils'
import { 
  GlassCard, 
  GlassCardHeader, 
  GlassCardTitle, 
  GlassCardDescription, 
  GlassCardContent,
  GlassCardFooter
} from "@/components/ui/glass-card"
import { SearchForm } from "@/components/search/search-form"
import { CaseStatus, CaseCategory } from "@looper-hq/database"

interface SearchParams {
  q?: string
  category?: string
  status?: string
}

interface SearchPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}

// Fetch public cases from database
async function searchPublicCases(params: SearchParams) {
  try {
    // Build where clause - only public cases
    const where: any = {
      isPublic: true,
    }

    // Search filter
    if (params.q) {
      where.OR = [
        { caseNumber: { contains: params.q, mode: 'insensitive' } },
        { title_zh: { contains: params.q, mode: 'insensitive' } },
        { title_en: { contains: params.q, mode: 'insensitive' } },
        { description_zh: { contains: params.q, mode: 'insensitive' } },
        { description_en: { contains: params.q, mode: 'insensitive' } },
        { publicNote_zh: { contains: params.q, mode: 'insensitive' } },
        { publicNote_en: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (params.category && Object.values(CaseCategory).includes(params.category as CaseCategory)) {
      where.category = params.category
    }

    // Status filter
    if (params.status && Object.values(CaseStatus).includes(params.status as CaseStatus)) {
      where.status = params.status
    }

    // Fetch public cases
    const cases = await prisma.case.findMany({
      where,
      orderBy: {
        startDate: 'desc',
      },
      take: 50, // Limit results
      select: {
        id: true,
        caseNumber: true,
        title_zh: true,
        title_en: true,
        category: true,
        status: true,
        startDate: true,
        publicNote_zh: true,
        publicNote_en: true,
      },
    })

    return cases
  } catch (error) {
    console.error('Error searching cases:', error)
    return []
  }
}

// Log search to SearchHistory
async function logSearch(query: string, resultsCount: number, ipAddress: string) {
  try {
    await prisma.searchHistory.create({
      data: {
        query,
        resultsCount,
        ipAddress,
      },
    })
  } catch (error) {
    console.error('Error logging search:', error)
  }
}

// Get client IP address
function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIp || 'unknown'
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
    DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    OPEN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    IN_PROGRESS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    COMPLETED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    CLOSED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    ARCHIVED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

// Format category for display
function formatCategory(category: CaseCategory): string {
  return category.replace('_', ' ')
}

// Truncate text
function truncate(text: string | null, length: number): string {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  
  // Get search results
  const results = resolvedSearchParams.q || resolvedSearchParams.category || resolvedSearchParams.status 
    ? await searchPublicCases(resolvedSearchParams)
    : []

  // Log search if there's a query
  if (resolvedSearchParams.q) {
    const headersList = await headers()
    const ipAddress = getClientIp(headersList)
    await logSearch(resolvedSearchParams.q, results.length, ipAddress)
  }

  const hasSearched = Boolean(resolvedSearchParams.q || resolvedSearchParams.category || resolvedSearchParams.status)
  const totalResults = results.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Scale className="h-10 w-10 text-premier-gold" />
          <h1 className="text-4xl font-bold tracking-tight text-gradient-gold">
            Public Case Search
          </h1>
        </div>
        <p className="text-premier-pearl-gray text-lg">
          Search for publicly available legal cases
        </p>
      </div>

      {/* Search Form */}
      <GlassCard variant="gold">
        <GlassCardContent className="pt-6">
          <SearchForm
            initialQuery={resolvedSearchParams.q}
            initialCategory={resolvedSearchParams.category}
            initialStatus={resolvedSearchParams.status}
          />
        </GlassCardContent>
      </GlassCard>

      {/* Search Stats */}
      {hasSearched && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Search Results"
            value={totalResults}
            icon={SearchIcon}
          />
          <StatCard
            title="Search Query"
            value={resolvedSearchParams.q || 'Filtered'}
            icon={FileText}
          />
          <StatCard
            title="Filters Applied"
            value={(resolvedSearchParams.category ? 1 : 0) + (resolvedSearchParams.status ? 1 : 0)}
            icon={AlertCircle}
          />
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div>
          {results.length === 0 ? (
            // Empty State
            <GlassCard>
              <GlassCardContent className="py-16">
                <div className="text-center">
                  <SearchIcon className="mx-auto h-16 w-16 text-premier-pearl-gray opacity-50" />
                  <h3 className="mt-4 text-xl font-semibold text-premier-pearl">No results found</h3>
                  <p className="mt-2 text-premier-pearl-gray">
                    Try adjusting your search query or filters
                  </p>
                </div>
              </GlassCardContent>
            </GlassCard>
          ) : (
            // Results Grid
            <>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-premier-pearl">
                  Found {totalResults} case{totalResults !== 1 ? 's' : ''}
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((caseItem) => (
                  <GlassCard key={caseItem.id} className="hover:border-premier-gold/50 transition-colors">
                    <GlassCardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <GlassCardTitle className="text-base truncate">
                            {caseItem.caseNumber}
                          </GlassCardTitle>
                          <GlassCardDescription className="mt-1 line-clamp-2">
                            {getLocalizedField(caseItem, 'title', locale as 'zh' | 'en')}
                          </GlassCardDescription>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(caseItem.status)}
                        >
                          {caseItem.status}
                        </Badge>
                      </div>
                    </GlassCardHeader>
                    <GlassCardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-premier-gold" />
                        <span className="text-premier-pearl-gray">
                          {formatCategory(caseItem.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-premier-gold" />
                        <span className="text-premier-pearl-gray">
                          {formatDate(caseItem.startDate)}
                        </span>
                      </div>
                      {getLocalizedField(caseItem, 'publicNote', locale as 'zh' | 'en') && (
                        <p className="text-sm text-premier-pearl-gray line-clamp-3 mt-2">
                          {truncate(getLocalizedField(caseItem, 'publicNote', locale as 'zh' | 'en'), 120)}
                        </p>
                      )}
                    </GlassCardContent>
                  </GlassCard>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <GlassCard>
          <GlassCardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-premier-gold/10 flex items-center justify-center">
                <SearchIcon className="h-8 w-8 text-premier-gold" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-premier-pearl">Start Your Search</h3>
                <p className="mt-2 text-premier-pearl-gray">
                  Enter a case number, title, or keywords to search for public cases
                </p>
              </div>
              <div className="pt-4">
                <div className="inline-flex flex-col gap-2 text-left">
                  <p className="text-sm text-premier-pearl-gray">
                    <span className="text-premier-gold">•</span> Search by case number (e.g., &quot;HK-2026-001&quot;)
                  </p>
                  <p className="text-sm text-premier-pearl-gray">
                    <span className="text-premier-gold">•</span> Search by case title or keywords
                  </p>
                  <p className="text-sm text-premier-pearl-gray">
                    <span className="text-premier-gold">•</span> Filter by category and status
                  </p>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  )
}
