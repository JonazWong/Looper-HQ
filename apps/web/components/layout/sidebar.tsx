"use client"

/**
 * Enhanced Sidebar with Premier Design System - Collapsible with i18n
 * Updated with next-intl for internationalization
 */

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Search,
  FileText,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldCheck,
  Scale,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations()
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Check if user is admin
  const isAdmin = session?.user?.role === 'ADMIN'

  const sidebarItems = [
    {
      labelKey: "dashboard" as const,
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
    },
    // === CORE FUNCTIONS ===
    {
      labelKey: "cases" as const,
      href: `/${locale}/cases`,
      icon: Briefcase,
    },
    {
      labelKey: "clients" as const,
      href: `/${locale}/clients`,
      icon: Users,
    },
    {
      labelKey: "search" as const,
      href: `/${locale}/search`,
      icon: Search,
    },
    {
      labelKey: "legalDatabase" as const,
      href: `/${locale}/public-cases`,
      icon: Scale,
    },
    {
      labelKey: "services" as const,
      href: `/${locale}/services`,
      icon: Database,
    },
    // === ADMIN ONLY (conditionally rendered) ===
    ...(isAdmin ? [{
      labelKey: "admin" as const,
      href: `/${locale}/admin`,
      icon: ShieldCheck,
    }] : []),
    // === SUPPORTING FEATURES ===
    {
      labelKey: "documents" as const,
      href: `/${locale}/documents`,
      icon: FileText,
    },
    {
      labelKey: "calendar" as const,
      href: `/${locale}/calendar`,
      icon: Calendar,
    },
    {
      labelKey: "settings" as const,
      href: `/${locale}/settings`,
      icon: Settings,
    },
  ]

  return (
    <motion.aside 
      className="hidden md:flex flex-col glass-card border-r border-premier-gold/10 relative"
      animate={{ width: isCollapsed ? '80px' : '256px' }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Collapse Toggle Button */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-50 h-6 w-6 rounded-full bg-gradient-to-br from-premier-gold to-premier-gold-rose flex items-center justify-center shadow-premier-glow hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3 text-premier-black" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-premier-black" />
        )}
      </motion.button>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-3">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const label = t(`nav.${item.labelKey}`)
            
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-premier-md px-3 py-2.5 text-sm font-medium transition-all group relative overflow-hidden",
                    isActive
                      ? "text-premier-gold"
                      : "text-premier-pearl-gray hover:text-premier-pearl",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? label : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-premier-gold to-premier-gold-rose rounded-r-full"
                      layoutId="activeIndicator"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Icon with gradient background on active/hover */}
                  <div className={cn(
                    "relative p-1.5 rounded-lg transition-all shrink-0",
                    isActive 
                      ? "bg-gradient-to-br from-premier-gold/20 to-premier-gold-rose/10" 
                      : "group-hover:bg-premier-gold/5"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-110",
                      isActive && "drop-shadow-premier-glow"
                    )} />
                  </div>
                  
                  {/* Title - hidden when collapsed */}
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span 
                        className="relative whitespace-nowrap"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {/* Hover glow effect */}
                  {isActive && (
                    <div className="absolute inset-0 bg-premier-gold/3 rounded-premier-md" />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </div>
      
      {/* Bottom section */}
      <div className="p-4 border-t border-premier-gold/10">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div 
              key="expanded"
              className="glass-frosted rounded-premier-md p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs text-premier-pearl-gray">
                {t('footer.premierEdition')}
              </p>
              <p className="text-sm font-medium text-gradient-gold mt-1">
                Professional Plan
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-premier-gold/20 to-premier-gold-rose/10 flex items-center justify-center">
                <span className="text-xs font-bold text-premier-gold">P</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
