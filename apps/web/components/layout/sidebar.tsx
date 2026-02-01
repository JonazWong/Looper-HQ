"use client"

/**
 * Enhanced Sidebar with Premier Design System
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Search,
  FileText,
  Calendar,
  Settings,
} from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Cases",
    href: "/dashboard/cases",
    icon: Briefcase,
  },
  {
    title: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Search",
    href: "/dashboard/search",
    icon: Search,
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col glass-card border-r border-premier-gold/10">
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-3">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
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
                      : "text-premier-pearl-gray hover:text-premier-pearl"
                  )}
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
                    "relative p-1.5 rounded-lg transition-all",
                    isActive 
                      ? "bg-gradient-to-br from-premier-gold/20 to-premier-gold-rose/10" 
                      : "group-hover:bg-premier-gold/10"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-110",
                      isActive && "drop-shadow-premier-glow"
                    )} />
                  </div>
                  
                  <span className="relative">
                    {item.title}
                  </span>
                  
                  {/* Hover glow effect */}
                  {isActive && (
                    <div className="absolute inset-0 bg-premier-gold/5 rounded-premier-md" />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </div>
      
      {/* Bottom section */}
      <div className="p-4 border-t border-premier-gold/10">
        <div className="glass-frosted rounded-premier-md p-3">
          <p className="text-xs text-premier-pearl-gray">
            Premier Edition
          </p>
          <p className="text-sm font-medium text-gradient-gold mt-1">
            Professional Plan
          </p>
        </div>
      </div>
    </aside>
  )
}
