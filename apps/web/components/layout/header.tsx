"use client"

/**
 * Enhanced Header with Premier Design System
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Scale, User, LogOut, Bell } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "./language-switcher"
import { useLocale } from "@/lib/i18n/locale-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/dashboard/cases", labelKey: "cases" },
  { href: "/dashboard/clients", labelKey: "clients" },
  { href: "/dashboard/search", labelKey: "search" },
]

export function Header() {
  const pathname = usePathname()
  const { locale, setLocale, t } = useLocale()

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-premier-gold/10 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          {/* Logo with glow effect */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <Scale className="h-6 w-6 text-premier-gold drop-shadow-premier-glow" />
            </motion.div>
            <span className="text-xl font-serif font-bold text-gradient-gold">
              Looper HQ
            </span>
          </Link>
          
          {/* Navigation with gold underline */}
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 group"
                >
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isActive 
                      ? "text-premier-gold" 
                      : "text-premier-pearl-gray hover:text-premier-pearl"
                  )}>
                    {t.nav[item.labelKey as keyof typeof t.nav]}
                  </span>
                  {/* Animated underline */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-premier-gold to-premier-gold-rose"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isActive ? 1 : 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher currentLocale={locale} onLocaleChange={setLocale} />
          
          {/* Notifications */}
          <motion.button
            className="relative p-2 rounded-premier-md text-premier-pearl-gray hover:text-premier-gold hover:bg-premier-gold/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-premier-gold shadow-premier-glow" />
          </motion.button>
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="h-10 w-10 rounded-full bg-gradient-to-br from-premier-gold to-premier-gold-rose flex items-center justify-center ring-2 ring-premier-gold/20 ring-offset-2 ring-offset-premier-black"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="h-5 w-5 text-premier-black" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-premier-gold/20">
              <DropdownMenuLabel className="text-premier-pearl">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-premier-gold/10" />
              <DropdownMenuItem className="text-premier-pearl-gray hover:text-premier-gold focus:text-premier-gold">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-premier-pearl-gray hover:text-premier-gold focus:text-premier-gold">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-premier-gold/10" />
              <DropdownMenuItem className="text-premier-pearl-gray hover:text-premier-gold focus:text-premier-gold">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
