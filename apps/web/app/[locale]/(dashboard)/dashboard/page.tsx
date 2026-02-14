/**
 * Looper HQ Dashboard Page
 * Core Legal Case Management Platform
 * Server Component - fetches real data from database
 */

import { 
  Briefcase, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  Upload,
  LucideIcon
} from "lucide-react"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { type Activity } from "@/components/ui/activity-timeline"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/api/auth"
import type { MembershipTier } from "@prisma/client"

// Icon mapping for activities
const activityIconMap: Record<string, LucideIcon> = {
  'CASE_CREATED': Briefcase,
  'CASE_UPDATED': FileText,
  'CASE_COMPLETED': TrendingUp,
  'DOCUMENT_UPLOADED': Upload,
  'COURT_HEARING': Calendar,
  'CLIENT_CREATED': Users,
  'CLIENT_UPDATED': Users,
}

// Constants
const UNKNOWN_USER = 'Unknown User'
const UNKNOWN_CLIENT = 'Unknown Client'

// Helper to get user initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Fetch dashboard stats from database
async function getDashboardStats() {
  try {
    // Get case statistics
    const totalCases = await prisma.case.count()
    const activeCases = await prisma.case.count({ where: { status: 'ACTIVE' } })
    const pendingCases = await prisma.case.count({ where: { status: 'PENDING' } })
    const completedCases = await prisma.case.count({ where: { status: 'COMPLETED' } })
    const archivedCases = await prisma.case.count({ where: { status: 'ARCHIVED' } })

    // Get client statistics
    const totalClients = await prisma.client.count()

    // Get case distribution by status
    const casesByStatus = [
      { label: 'Active', value: activeCases, color: '#D4AF37' },
      { label: 'Pending', value: pendingCases, color: '#4A148C' },
      { label: 'Completed', value: completedCases, color: '#10b981' },
      { label: 'Archived', value: archivedCases, color: '#6b7280' },
    ]

    // Get recent cases
    const recentCases = await prisma.case.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Transform cases to ensure client name is never null and serialize Decimal fields
    const formattedRecentCases = recentCases.map(case_ => ({
      ...case_,
      estimatedValue: case_.estimatedValue ? Number(case_.estimatedValue) : null,
      client: {
        id: case_.client.id,
        name: case_.client.name || UNKNOWN_CLIENT
      }
    }))

    // Calculate success rate (completed / total non-cancelled)
    const nonCancelledCases = await prisma.case.count({
      where: {
        status: {
          not: 'CANCELLED',
        },
      },
    })
    const successRate = nonCancelledCases > 0 
      ? Math.round((completedCases / nonCancelledCases) * 100) 
      : 0

    return {
      totalCases,
      activeCases,
      pendingCases,
      totalClients,
      successRate,
      casesByStatus,
      recentCases: formattedRecentCases,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values on error
    return {
      totalCases: 0,
      activeCases: 0,
      pendingCases: 0,
      totalClients: 0,
      successRate: 0,
      casesByStatus: [],
      recentCases: [],
    }
  }
}

// Fetch recent activities from database
async function getRecentActivities() {
  try {
    // Get activities
    const activities = await prisma.activity.findMany({
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            title_zh: true,
            title_en: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform to component format (serialize icon to string)
    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      user: {
        name: activity.user.name || UNKNOWN_USER,
        initials: getInitials(activity.user.name || UNKNOWN_USER),
      },
      action: activity.action,
      description: activity.description || `${activity.action} - ${activity.case?.title || 'System'}`,
      timestamp: activity.createdAt.toISOString(),
      iconType: activity.type, // Send icon type instead of component
    }))
    
    return formattedActivities
  } catch (error) {
    console.error('Error fetching activities:', error)
    return []
  }
}

export default async function DashboardPage() {
  // Get authenticated user
  const session = await requireAuth()
  
  // Fetch user's membership tier from memberships relation
  const userMemberships = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    orderBy: { startDate: 'desc' },
    select: { tier: true }
  })
  
  const membershipTier = userMemberships?.tier || 'BASIC'
  
  // Fetch data in parallel
  const [stats, activities] = await Promise.all([
    getDashboardStats(),
    getRecentActivities(),
  ])

  return <DashboardContent 
    stats={stats} 
    activities={activities} 
    membershipTier={membershipTier}
  />
}

