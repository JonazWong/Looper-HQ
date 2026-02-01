'use client'

/**
 * Enhanced Dashboard Page with Premier Design System
 */

import { motion } from "framer-motion"
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
  Clock
} from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card"
import { PremierButton } from "@/components/ui/premier-button"
import { ProgressRing } from "@/components/ui/progress-ring"
import { ActivityTimeline, type Activity } from "@/components/ui/activity-timeline"
import { containerVariants, itemVariants } from "@/lib/animations"

// Sample data
const caseSegments = [
  { label: 'Active', value: 15, color: '#D4AF37' },
  { label: 'Pending', value: 8, color: '#4A148C' },
  { label: 'Completed', value: 20, color: '#10b981' },
  { label: 'Archived', value: 5, color: '#6b7280' },
]

const recentActivities: Activity[] = [
  {
    id: '1',
    user: { name: 'Sarah Chen', initials: 'SC' },
    action: 'filed',
    description: 'New case: Wong v. Chan Property Dispute',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    icon: Briefcase,
  },
  {
    id: '2',
    user: { name: 'Michael Lee', initials: 'ML' },
    action: 'updated',
    description: 'Case documents uploaded for HCA 1234/2024',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    icon: Upload,
  },
  {
    id: '3',
    user: { name: 'Emily Wong', initials: 'EW' },
    action: 'scheduled',
    description: 'Court hearing for Li Family Trust',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    icon: Calendar,
  },
  {
    id: '4',
    user: { name: 'David Tam', initials: 'DT' },
    action: 'completed',
    description: 'Settlement reached in ABC Ltd merger',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    icon: TrendingUp,
  },
  {
    id: '5',
    user: { name: 'Lisa Chan', initials: 'LC' },
    action: 'created',
    description: 'New client profile: Henderson Properties',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    icon: Users,
  },
]

const quickActions = [
  { label: 'New Case', icon: Plus, variant: 'primary' as const, href: '/dashboard/cases/new' },
  { label: 'Add Client', icon: Users, variant: 'secondary' as const, href: '/dashboard/clients/new' },
  { label: 'Search Cases', icon: Search, variant: 'secondary' as const, href: '/dashboard/search' },
  { label: 'View Reports', icon: BarChart3, variant: 'secondary' as const, href: '/dashboard/reports' },
  { label: 'Schedule Meeting', icon: Calendar, variant: 'secondary' as const, href: '/dashboard/calendar' },
  { label: 'Upload Documents', icon: Upload, variant: 'secondary' as const, href: '/dashboard/documents/upload' },
]

export default function DashboardPage() {
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
          Dashboard
        </h1>
        <p className="text-premier-pearl-gray">
          Welcome back! Here&apos;s an overview of your legal practice.
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
            value={42}
            change={{ value: 12, trend: 'up', label: 'from last month' }}
            icon={Briefcase}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StatCard
            title="Active Clients"
            value={28}
            change={{ value: 5, trend: 'up', label: 'from last month' }}
            icon={Users}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StatCard
            title="Pending Reviews"
            value={8}
            change={{ value: 3, trend: 'down', label: 'from yesterday' }}
            icon={FileText}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <StatCard
            title="Success Rate"
            value="92%"
            change={{ value: 8, trend: 'up', label: 'this quarter' }}
            icon={TrendingUp}
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
                  <PremierButton
                    variant={action.variant}
                    icon={action.icon}
                    className="w-full h-auto py-4 flex-col gap-2"
                  >
                    <span className="text-xs">{action.label}</span>
                  </PremierButton>
                </motion.div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Case Progress Overview */}
        <motion.div variants={itemVariants}>
          <GlassCard variant="gold" glow>
            <GlassCardHeader>
              <GlassCardTitle>Case Distribution</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="flex justify-center py-8">
              <ProgressRing segments={caseSegments} size={240} strokeWidth={24} />
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
                activities={recentActivities}
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
              {[
                {
                  id: "1",
                  caseNumber: "HCA 1234/2024",
                  title: "Wong v. Chan Property Dispute",
                  status: "in-progress",
                  client: "Mr. Wong",
                },
                {
                  id: "2",
                  caseNumber: "HCA 5678/2024",
                  title: "Li Family Trust Administration",
                  status: "open",
                  client: "Li Family",
                },
                {
                  id: "3",
                  caseNumber: "HCA 9012/2024",
                  title: "Corporate Merger - ABC Ltd",
                  status: "in-progress",
                  client: "ABC Limited",
                },
              ].map((case_, index) => (
                <motion.div
                  key={case_.id}
                  className="flex items-center justify-between border-b border-premier-gold/10 pb-4 last:border-0 last:pb-0 hover:bg-premier-gold/5 -mx-4 px-4 py-2 rounded-premier-md transition-colors cursor-pointer group"
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
                      <div className="font-medium text-premier-pearl">{case_.title}</div>
                      <div className="text-sm text-premier-pearl-gray">
                        {case_.caseNumber} • {case_.client}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        case_.status === "in-progress"
                          ? "bg-amber-500/20 text-amber-200"
                          : "bg-blue-500/20 text-blue-200"
                      }`}
                    >
                      {case_.status === "in-progress" ? "In Progress" : "Open"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

