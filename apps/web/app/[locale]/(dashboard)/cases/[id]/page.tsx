/**
 * Case Detail Page - Server Component
 * Displays comprehensive case information including documents, activities, notes, and time logs
 */

import { notFound } from "next/navigation"
import Link from "next/link"
import { 
  Briefcase, 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock, 
  Users,
  AlertCircle,
  Edit,
  ArrowLeft,
  Download,
  Upload,
  Plus,
  MessageSquare,
  Activity as ActivityIcon,
  LucideIcon
} from "lucide-react"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { PremierButton } from "@/components/ui/premier-button"
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
import { ActivityTimeline, type Activity } from "@/components/ui/activity-timeline"
import { CaseStatus, Priority, CaseCategory, ActivityType } from "@prisma/client"
import { formatHKDate, formatHKDateTime } from "@/lib/utils"
import { getLocalizedField } from "@looper-hq/utils"

interface CaseDetailPageProps {
  params: Promise<{ id: string; locale: string }>
}

// Constants
const UNKNOWN_CLIENT = 'Unknown Client'
const UNKNOWN_LAWYER = 'Unassigned'
const UNKNOWN_USER = 'Unknown User'

// Activity icon mapping
const activityIconMap: Record<ActivityType, LucideIcon> = {
  CASE_CREATED: Briefcase,
  CASE_UPDATED: FileText,
  CASE_CLOSED: AlertCircle,
  DOCUMENT_UPLOADED: Upload,
  CLIENT_ADDED: Users,
  MEETING_SCHEDULED: Calendar,
  PAYMENT_RECEIVED: DollarSign,
  NOTE_ADDED: MessageSquare,
  STATUS_CHANGED: ActivityIcon,
}

// Helper to get user initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Fetch case details
async function getCaseDetails(id: string) {
  try {
    const case_ = await prisma.case.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        lawyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
          include: {
            uploadedBy: {
              select: {
                name: true,
              },
            },
          },
        },
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        notes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        timeLogs: {
          orderBy: {
            logDate: 'desc',
          },
        },
      },
    })

    if (!case_) {
      return null
    }

    return case_
  } catch (error) {
    console.error('Error fetching case details:', error)
    return null
  }
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

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id, locale } = await params
  const case_ = await getCaseDetails(id)

  if (!case_) {
    notFound()
  }

  // Calculate total billable hours
  const totalBillableHours = case_.timeLogs
    .filter(log => log.billable)
    .reduce((sum, log) => sum + Number(log.hours), 0)

  // Calculate total billable amount
  const totalBillableAmount = case_.timeLogs
    .filter(log => log.billable && log.hourlyRate)
    .reduce((sum, log) => sum + Number(log.hours) * Number(log.hourlyRate), 0)

  // Transform activities for timeline
  const activities: Activity[] = case_.activities.map(activity => ({
    id: activity.id,
    user: {
      name: activity.user.name || UNKNOWN_USER,
      initials: getInitials(activity.user.name || UNKNOWN_USER),
    },
    action: activity.action,
    description: activity.description || activity.action,
    timestamp: activity.createdAt,
    icon: activityIconMap[activity.type] || FileText,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cases">
            <PremierButton variant="ghost" icon={ArrowLeft} size="icon" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">
                {case_.caseNumber}
              </h1>
              <Badge 
                variant="outline" 
                className={getStatusColor(case_.status)}
              >
                {case_.status}
              </Badge>
              <Badge 
                variant="outline" 
                className={getPriorityColor(case_.priority)}
              >
                {case_.priority}
              </Badge>
            </div>
            <p className="text-premier-pearl-gray mt-1">
              {getLocalizedField(case_, 'title', locale as 'zh' | 'en')}
            </p>
          </div>
        </div>
        <Link href={`/cases/${case_.id}/edit`}>
          <PremierButton variant="primary" icon={Edit}>
            Edit Case
          </PremierButton>
        </Link>
      </div>

      {/* Case Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard variant="gold" glow>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Case Information
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div>
              <label className="text-sm text-premier-pearl-gray">Category</label>
              <p className="text-premier-pearl font-medium">
                {formatCategory(case_.category)}
              </p>
            </div>
            <div>
              <label className="text-sm text-premier-pearl-gray">Description</label>
              <p className="text-premier-pearl">
                {getLocalizedField(case_, 'description', locale as 'zh' | 'en') || 'No description provided'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-premier-pearl-gray">Start Date</label>
                <p className="text-premier-pearl font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatHKDate(case_.startDate)}
                </p>
              </div>
              {case_.courtDate && (
                <div>
                  <label className="text-sm text-premier-pearl-gray">Court Date</label>
                  <p className="text-premier-pearl font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatHKDate(case_.courtDate)}
                  </p>
                </div>
              )}
            </div>
            {case_.estimatedValue && (
              <div>
                <label className="text-sm text-premier-pearl-gray">Estimated Value</label>
                <p className="text-premier-pearl font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  HKD {Number(case_.estimatedValue).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm text-premier-pearl-gray">Public Visibility</label>
              <p className="text-premier-pearl">
                {case_.isPublic ? 'Public' : 'Private'}
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="default">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              People
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div>
              <label className="text-sm text-premier-pearl-gray">Client</label>
              <Link href={`/clients/${case_.client.id}`}>
                <p className="text-premier-gold hover:underline font-medium">
                  {case_.client.name || UNKNOWN_CLIENT}
                </p>
              </Link>
              <p className="text-sm text-premier-pearl-gray">
                {case_.client.email}
              </p>
              {case_.client.phone && (
                <p className="text-sm text-premier-pearl-gray">
                  {case_.client.phone}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-premier-pearl-gray">Assigned Lawyer</label>
              <p className="text-premier-pearl font-medium">
                {case_.lawyer?.name || UNKNOWN_LAWYER}
              </p>
              {case_.lawyer?.email && (
                <p className="text-sm text-premier-pearl-gray">
                  {case_.lawyer.email}
                </p>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Documents */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <GlassCardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </GlassCardTitle>
              <GlassCardDescription>
                {case_.documents.length} document{case_.documents.length === 1 ? '' : 's'}
              </GlassCardDescription>
            </div>
            <PremierButton variant="primary" icon={Upload} size="sm">
              Upload Document
            </PremierButton>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {case_.documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-premier-pearl-gray mx-auto mb-4" />
              <p className="text-premier-pearl-gray">No documents uploaded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-premier-gold/20">
                  <TableHead className="text-premier-gold">File Name</TableHead>
                  <TableHead className="text-premier-gold">Category</TableHead>
                  <TableHead className="text-premier-gold">Size</TableHead>
                  <TableHead className="text-premier-gold">Uploaded By</TableHead>
                  <TableHead className="text-premier-gold">Date</TableHead>
                  <TableHead className="text-premier-gold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {case_.documents.map((doc) => (
                  <TableRow 
                    key={doc.id} 
                    className="border-premier-gold/10 hover:bg-premier-gold/5"
                  >
                    <TableCell className="font-medium text-premier-pearl">
                      {doc.fileName}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="bg-premier-mystery-violet/20 text-premier-mystery-violet border-premier-mystery-violet/30"
                      >
                        {doc.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-premier-pearl-gray">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell className="text-premier-pearl-gray">
                      {doc.uploadedBy.name || UNKNOWN_USER}
                    </TableCell>
                    <TableCell className="text-premier-pearl-gray">
                      {formatHKDate(doc.uploadedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <PremierButton 
                        variant="ghost" 
                        size="icon" 
                        icon={Download}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Activities Timeline and Time Logs */}
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard variant="default">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5" />
              Recent Activity
            </GlassCardTitle>
            <GlassCardDescription>
              Latest updates and changes
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <ActivityIcon className="h-12 w-12 text-premier-pearl-gray mx-auto mb-4" />
                <p className="text-premier-pearl-gray">No activities yet</p>
              </div>
            ) : (
              <ActivityTimeline activities={activities} />
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard variant="gold" glow>
          <GlassCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Logs
                </GlassCardTitle>
                <GlassCardDescription>
                  {totalBillableHours.toFixed(2)} billable hours • HKD {totalBillableAmount.toLocaleString()}
                </GlassCardDescription>
              </div>
              <PremierButton variant="primary" icon={Plus} size="sm">
                Add Time
              </PremierButton>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {case_.timeLogs.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-premier-pearl-gray mx-auto mb-4" />
                <p className="text-premier-pearl-gray">No time logs yet</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {case_.timeLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="border border-premier-gold/20 rounded-lg p-4 hover:bg-premier-gold/5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-premier-pearl font-medium">
                          {log.description}
                        </p>
                        <p className="text-sm text-premier-pearl-gray mt-1">
                          {formatHKDate(log.logDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-premier-gold font-medium">
                          {Number(log.hours).toFixed(2)} hrs
                        </p>
                        {log.billable && log.hourlyRate && (
                          <p className="text-sm text-premier-pearl-gray">
                            HKD {(Number(log.hours) * Number(log.hourlyRate)).toLocaleString()}
                          </p>
                        )}
                        <Badge 
                          variant="outline" 
                          className={log.billable 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30 mt-1' 
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30 mt-1'
                          }
                        >
                          {log.billable ? 'Billable' : 'Non-billable'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Notes */}
      <GlassCard variant="default">
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <GlassCardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notes
              </GlassCardTitle>
              <GlassCardDescription>
                {case_.notes.length} note{case_.notes.length === 1 ? '' : 's'}
              </GlassCardDescription>
            </div>
            <PremierButton variant="primary" icon={Plus} size="sm">
              Add Note
            </PremierButton>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {case_.notes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-premier-pearl-gray mx-auto mb-4" />
              <p className="text-premier-pearl-gray">No notes yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {case_.notes.map((note) => (
                <div 
                  key={note.id} 
                  className="border border-premier-gold/20 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {note.isPrivate && (
                        <Badge 
                          variant="outline" 
                          className="bg-red-500/20 text-red-400 border-red-500/30"
                        >
                          Private
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-premier-pearl-gray">
                      {formatHKDateTime(note.createdAt)}
                    </p>
                  </div>
                  <p className="text-premier-pearl whitespace-pre-wrap">
                    {getLocalizedField(note, 'content', locale as 'zh' | 'en')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
