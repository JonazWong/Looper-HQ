'use client'

/**
 * Dashboard Content - Client Component for animations
 */

import { motion } from "framer-motion"
import Link from "next/link"
import { useLocale, useTranslations } from 'next-intl'
import { 
  Briefcase, 
  Users, 
  FileText, 
  TrendingUp, 
  Plus,
  Search,
  Calendar,
  Upload,
  BarChart3,
  FolderOpen,
  Clock,
  LucideIcon
} from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card"
import { PremierButton } from "@/components/ui/premier-button"
import { ProgressRing } from "@/components/ui/progress-ring"
import { ActivityTimeline, type Activity } from "@/components/ui/activity-timeline"
import { containerVariants, itemVariants } from "@/lib/animations"
import { PremierSearchCard } from "./premier-search-card"
import { getLocalizedField } from "@looper-hq/utils"
import type { MembershipTier } from "@looper-hq/database"

// Icon mapping for activity types
const activityIconMap: Record<string, LucideIcon> = {
  'CASE_CREATED': Briefcase,
  'CASE_UPDATED': FileText,
  'CASE_COMPLETED': TrendingUp,
  'DOCUMENT_UPLOADED': Upload,
  'COURT_HEARING': Calendar,
  'CLIENT_CREATED': Users,
  'CLIENT_UPDATED': Users,
}

interface CaseSegment {
  label: string
  value: number
  color: string
}

interface RecentCase {
  id: string
  caseNumber: string
  title_zh: string
  title_en: string
  status: string
  client: {
    id: string
    name: string
  }
}

interface DashboardStats {
  totalCases: number
  activeCases: number
  totalClients: number
  pendingCases: number
  successRate: number
  casesByStatus: CaseSegment[]
  recentCases: RecentCase[]
}

interface SerializedActivity {
  id: string
  user: {
    name: string
    initials: string
  }
  action: string
  description: string
  timestamp: string
  iconType: string
}

interface DashboardContentProps {
  stats: DashboardStats
  activities: SerializedActivity[]
  membershipTier: MembershipTier
}

const getStatusDisplay = (status: string) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    'ACTIVE': { label: 'Active', className: 'bg-amber-500/20 text-amber-200' },
    'PENDING': { label: 'Pending', className: 'bg-blue-500/20 text-blue-200' },
    'COMPLETED': { label: 'Completed', className: 'bg-green-500/20 text-green-200' },
    'ARCHIVED': { label: 'Archived', className: 'bg-gray-500/20 text-gray-200' },
  }
  return statusMap[status] || { label: status, className: 'bg-gray-500/20 text-gray-200' }
}
export function DashboardContent({ stats, activities, membershipTier }: DashboardContentProps) {
  const locale = useLocale()
  
  // Quick actions with locale-aware routes
  const quickActions = [
    { label: 'New Case', icon: <Plus className="h-4 w-4" />, variant: 'primary' as const, href: `/${locale}/cases/new` },
    { label: 'Add Client', icon: <Users className="h-4 w-4" />, variant: 'secondary' as const, href: `/${locale}/clients` },
    { label: 'Search Cases', icon: <Search className="h-4 w-4" />, variant: 'secondary' as const, href: `/${locale}/search` },
    { label: 'View Cases', icon: <Briefcase className="h-4 w-4" />, variant: 'secondary' as const, href: `/${locale}/cases` },
    { label: 'View Clients', icon: <Users className="h-4 w-4" />, variant: 'secondary' as const, href: `/${locale}/clients` },
    { label: 'Upload Documents', icon: <Upload className="h-4 w-4" />, variant: 'secondary' as const, href: `/${locale}/documents` },
  ]
  
  // Convert serialized activities to Activity format with icons
  const activitiesWithIcons: Activity[] = activities.map(activity => ({
    ...activity,
    timestamp: new Date(activity.timestamp),
    icon: activityIconMap[activity.iconType] || FileText,
  }))
  
  // Check if user has premium access
  const hasPremiumAccess = membershipTier === 'PREMIUM' || membershipTier === 'PREMIER'

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-serif font-bold text-gradient-gold mb-2">
          Looper HQ
        </h1>
        <p className="text-premier-pearl-gray">
          香港法律案件管理系統 - 專業高效的案件與客戶管理平台
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <StatCard
            title="Total Cases"
            value={stats.totalCases}
            change={{ value: 12, trend: 'up', label: 'from last month' }}
            icon={<Briefcase className="h-4 w-4" />}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StatCard
            title="Active Clients"
            value={stats.totalClients}
            change={{ value: 5, trend: 'up', label: 'from last month' }}
            icon={<Users className="h-4 w-4" />}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StatCard
            title="Pending Reviews"
            value={stats.pendingCases}
            change={{ value: 3, trend: 'down', label: 'from yesterday' }}
            icon={<FileText className="h-4 w-4" />}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            change={{ value: 8, trend: 'up', label: 'this quarter' }}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <GlassCard variant="frosted" glow={false}>
          <GlassCardHeader>
            <GlassCardTitle>Quick Actions</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Link href={action.href}>
                    <PremierButton
                      variant={action.variant}
                      icon={action.icon}
                      className="w-full h-auto py-4 flex-col gap-2"
                    >
                      <span className="text-xs">{action.label}</span>
                    </PremierButton>
                  </Link>
                </motion.div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* Premier Exclusive: Public Case Search - Only for PREMIUM/PREMIER members */}
      {hasPremiumAccess && (
        <PremierSearchCard membershipTier={membershipTier as 'PREMIUM' | 'PREMIER'} />
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Case Progress Overview */}
        <motion.div variants={itemVariants}>
          <GlassCard variant="gold" glow>
            <GlassCardHeader>
              <GlassCardTitle>Case Distribution</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="flex justify-center py-8">
              <ProgressRing segments={stats.casesByStatus} size={240} strokeWidth={24} />
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Recent Activity Timeline */}
        <motion.div variants={itemVariants}>
          <GlassCard variant="mystery" glow>
            <GlassCardHeader>
              <GlassCardTitle>Recent Activity</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <ActivityTimeline 
                activities={activitiesWithIcons}
                showLoadMore
                onLoadMore={() => console.log('Load more')}
              />
            </GlassCardContent>
          </GlassCard>
        </motion.div>
      </div>

      {/* Recent Cases */}
      <motion.div variants={itemVariants}>
        <GlassCard variant="default" glow>
          <GlassCardHeader>
            <GlassCardTitle>Recent Cases</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {stats.recentCases.map((case_, index) => {
                const statusDisplay = getStatusDisplay(case_.status);
                return (
                  <Link key={case_.id} href={`/${locale}/cases/${case_.id}`}>
                    <motion.div
                      className="flex items-center justify-between border-b border-premier-gold/5 pb-4 last:border-0 last:pb-0 hover:bg-premier-gold/3 -mx-4 px-4 py-2 rounded-premier-md transition-colors cursor-pointer group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      whileHover={{ x: 4 }}
                    >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-premier-gold/20 to-premier-gold-rose/10 flex items-center justify-center group-hover:from-premier-gold/30 group-hover:to-premier-gold-rose/20 transition-all">
                        <FolderOpen className="h-5 w-5 text-premier-gold" />
                      </div>
                      <div>
                        <div className="font-medium text-premier-pearl">{getLocalizedField(case_, 'title', locale as 'zh' | 'en')}</div>
                        <div className="text-sm text-premier-pearl-gray">
                          {case_.caseNumber} • {case_.client.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                        {statusDisplay.label}
                      </span>
                    </div>
                  </motion.div>
                  </Link>
                )
              })}
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
