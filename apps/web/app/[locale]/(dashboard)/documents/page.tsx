/**
 * Documents Page - Server Component
 * Displays document management with upload, search, and filter capabilities
 */

import Link from "next/link"
import { getTranslations } from 'next-intl/server'
import { 
  FileText, 
  Upload, 
  Download, 
  Eye,
  Search,
  Filter,
  FolderOpen,
  File
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
import { DocumentCategory } from "@looper-hq/database"
import { formatHKDate } from "@/lib/utils"

interface SearchParams {
  search?: string
  category?: string
  page?: string
}

interface DocumentsPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}

// Constants
const DOCUMENTS_PER_PAGE = 15
const UNKNOWN_USER = 'Unknown User'

// Fetch documents
async function getDocuments(params: SearchParams) {
  try {
    const page = parseInt(params.page || '1')
    const skip = (page - 1) * DOCUMENTS_PER_PAGE

    // Build where clause
    const where: any = {}

    // Search filter
    if (params.search) {
      where.OR = [
        { fileName: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { case: { title: { contains: params.search, mode: 'insensitive' } } },
        { case: { caseNumber: { contains: params.search, mode: 'insensitive' } } },
      ]
    }

    // Category filter
    if (params.category && Object.values(DocumentCategory).includes(params.category as DocumentCategory)) {
      where.category = params.category
    }

    const [documents, totalDocuments] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: DOCUMENTS_PER_PAGE,
        orderBy: {
          uploadedAt: 'desc',
        },
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              title_zh: true,
              title_en: true,
            },
          },
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ])

    return {
      documents,
      totalDocuments,
      currentPage: page,
      totalPages: Math.ceil(totalDocuments / DOCUMENTS_PER_PAGE),
    }
  } catch (error) {
    console.error('Error fetching documents:', error)
    return {
      documents: [],
      totalDocuments: 0,
      currentPage: 1,
      totalPages: 0,
    }
  }
}

// Fetch document statistics
async function getDocumentStats() {
  try {
    const [
      totalDocuments,
      contractsCount,
      evidenceCount,
      courtFilingsCount,
      totalSize,
    ] = await Promise.all([
      prisma.document.count(),
      prisma.document.count({ where: { category: 'CONTRACT' } }),
      prisma.document.count({ where: { category: 'EVIDENCE' } }),
      prisma.document.count({ where: { category: 'COURT_FILING' } }),
      prisma.document.aggregate({
        _sum: { fileSize: true },
      }),
    ])

    return {
      totalDocuments,
      contractsCount,
      evidenceCount,
      courtFilingsCount,
      totalSize: Number(totalSize._sum.fileSize || 0),
    }
  } catch (error) {
    console.error('Error fetching document stats:', error)
    return {
      totalDocuments: 0,
      contractsCount: 0,
      evidenceCount: 0,
      courtFilingsCount: 0,
      totalSize: 0,
    }
  }
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

// Get category badge color
function getCategoryColor(category: DocumentCategory): string {
  const colors: Record<DocumentCategory, string> = {
    CONTRACT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    EVIDENCE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    COURT_FILING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    CORRESPONDENCE: 'bg-green-500/20 text-green-400 border-green-500/30',
    INVOICE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    OTHER: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

// Get file type icon
function getFileTypeIcon(fileType: string): typeof FileText {
  if (fileType.includes('pdf')) return FileText
  if (fileType.includes('image')) return File
  if (fileType.includes('word') || fileType.includes('document')) return FileText
  return File
}

export default async function DocumentsPage({ params, searchParams }: DocumentsPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale })
  const resolvedSearchParams = await searchParams
  
  const [{ documents, totalDocuments, currentPage, totalPages }, stats] = await Promise.all([
    getDocuments(resolvedSearchParams),
    getDocumentStats(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
            {t('documents.title')}
          </h1>
          <p className="text-premier-pearl-gray">
            {t('documents.subtitle')}
          </p>
        </div>
        <PremierButton variant="primary" icon={<Upload className="h-4 w-4" />}>
          {t('documents.uploadDocument')}
        </PremierButton>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('documents.totalDocuments')}
          value={stats.totalDocuments}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          title={t('documents.contracts')}
          value={stats.contractsCount}
          icon={<File className="h-4 w-4" />}
        />
        <StatCard
          title={t('documents.evidence')}
          value={stats.evidenceCount}
          icon={<FolderOpen className="h-4 w-4" />}
        />
        <StatCard
          title={t('documents.storageUsed')}
          value={formatFileSize(stats.totalSize)}
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      {/* Search and Filters */}
      <GlassCard variant="default">
        <GlassCardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-premier-pearl-gray" />
                <form action={`/${locale}/documents`} method="get">
                  <Input
                    name="search"
                    defaultValue={resolvedSearchParams.search}
                    placeholder={t('documents.searchPlaceholder')}
                    className="pl-10 bg-premier-charcoal/50 border-premier-gold/30 text-premier-pearl"
                  />
                  {resolvedSearchParams.category && (
                    <input type="hidden" name="category" value={resolvedSearchParams.category} />
                  )}
                </form>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <Link href={`/${locale}/documents`}>
                <Badge 
                  variant="outline"
                  className={!resolvedSearchParams.category 
                    ? 'bg-premier-gold/20 text-premier-gold border-premier-gold/40'
                    : 'bg-premier-charcoal/50 text-premier-pearl-gray border-premier-gold/20 hover:bg-premier-gold/10 cursor-pointer'
                  }
                >
                  {t('documents.all')} ({stats.totalDocuments})
                </Badge>
              </Link>
              {Object.values(DocumentCategory).map((category) => (
                <Link 
                  key={category} 
                  href={`/${locale}/documents?category=${category}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ''}`}
                >
                  <Badge 
                    variant="outline"
                    className={resolvedSearchParams.category === category
                      ? 'bg-premier-gold/20 text-premier-gold border-premier-gold/40'
                      : 'bg-premier-charcoal/50 text-premier-pearl-gray border-premier-gold/20 hover:bg-premier-gold/10 cursor-pointer'
                    }
                  >
                    {t(`documents.categories.${category}` as const)}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Documents Table */}
      <GlassCard variant="gold" glow>
        <GlassCardHeader>
          <GlassCardTitle>{t('documents.allDocuments')}</GlassCardTitle>
          <GlassCardDescription>
            {totalDocuments === 0 
              ? t('documents.noDocumentsFound') 
              : t('documents.totalDocumentsInSystem', { count: totalDocuments })
            }
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-premier-pearl-gray mb-4" />
              <h3 className="text-lg font-medium text-premier-pearl mb-2">
                {t('documents.noDocumentsFound')}
              </h3>
              <p className="text-sm text-premier-pearl-gray mb-6 text-center max-w-md">
                {resolvedSearchParams.search || resolvedSearchParams.category
                  ? t('documents.noDocumentsFoundFilter')
                  : t('documents.noDocumentsFoundEmpty')}
              </p>
              <PremierButton variant="primary" icon={<Upload className="h-4 w-4" />}>
                {t('documents.uploadDocument')}
              </PremierButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-premier-gold/20">
                      <TableHead className="text-premier-gold">{t('documents.fileName')}</TableHead>
                      <TableHead className="text-premier-gold">{t('documents.case')}</TableHead>
                      <TableHead className="text-premier-gold">{t('documents.category')}</TableHead>
                      <TableHead className="text-premier-gold">{t('documents.fileSize')}</TableHead>
                      <TableHead className="text-premier-gold">{t('documents.uploadedBy')}</TableHead>
                      <TableHead className="text-premier-gold">{t('documents.uploadDate')}</TableHead>
                      <TableHead className="text-premier-gold text-right">{t('common.view')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const FileIcon = getFileTypeIcon(doc.fileType)
                      return (
                        <TableRow 
                          key={doc.id} 
                          className="border-premier-gold/10 hover:bg-premier-gold/5 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileIcon className="h-4 w-4 text-premier-gold" />
                              <span className="text-premier-pearl">{doc.fileName}</span>
                              {doc.isConfidential && (
                                <Badge 
                                  variant="outline" 
                                  className="bg-red-500/20 text-red-400 border-red-500/30 text-xs"
                                >
                                  {t('documents.confidential')}
                                </Badge>
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-xs text-premier-pearl-gray mt-1 max-w-md truncate">
                                {doc.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {doc.case ? (
                              <Link
                                href={`/${locale}/cases/${doc.case.id}`}
                                className="text-premier-gold hover:underline"
                              >
                                {doc.case.caseNumber}
                              </Link>
                            ) : (
                              <span className="text-premier-pearl-gray">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getCategoryColor(doc.category)}
                            >
                              {t(`documents.categories.${doc.category}` as const)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-premier-pearl-gray">
                            {formatFileSize(doc.fileSize)}
                          </TableCell>
                          <TableCell className="text-premier-pearl-gray">
                            {doc.uploadedBy.name || t('documents.unknownUser')}
                          </TableCell>
                          <TableCell className="text-premier-pearl-gray">
                            {formatHKDate(doc.uploadedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <PremierButton 
                                variant="ghost" 
                                size="icon" 
                                icon={<Eye className="h-4 w-4" />}
                              />
                              <PremierButton 
                                variant="ghost" 
                                size="icon" 
                                icon={<Download className="h-4 w-4" />}
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
                    {t('documents.showingDocuments', {
                      start: ((currentPage - 1) * DOCUMENTS_PER_PAGE) + 1,
                      end: Math.min(currentPage * DOCUMENTS_PER_PAGE, totalDocuments),
                      count: totalDocuments,
                    })}
                  </p>
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <Link href={`/${locale}/documents?${new URLSearchParams({ ...resolvedSearchParams, page: String(currentPage - 1) })}`}>
                        <PremierButton variant="ghost" size="sm">
                          {t('documents.previous')}
                        </PremierButton>
                      </Link>
                    )}
                    {currentPage < totalPages && (
                      <Link href={`/${locale}/documents?${new URLSearchParams({ ...resolvedSearchParams, page: String(currentPage + 1) })}`}>
                        <PremierButton variant="ghost" size="sm">
                          {t('documents.next')}
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
