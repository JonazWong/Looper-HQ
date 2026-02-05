'use client'

/**
 * Enhanced Dashboard Layout with Premier Design System
 */

import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Footer } from "./footer"
import { ParticleBackground } from "@/components/effects/particle-background"
import { LocaleProvider } from "@/lib/i18n/locale-provider"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <LocaleProvider>
      <div className="flex min-h-screen flex-col relative bg-premier-black">
        {/* Ambient particle effect */}
        <ParticleBackground particleCount={30} />
        
        {/* Radial gradient overlay */}
        <div className="fixed inset-0 bg-premier-veil pointer-events-none" />
        
        <Header />
        <div className="flex flex-1 relative z-10">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="container py-8 px-6">{children}</div>
          </main>
        </div>
        <Footer />
      </div>
    </LocaleProvider>
  )
}
