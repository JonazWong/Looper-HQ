import Link from "next/link"
import { ArrowRight, Scale, Shield, Search, Users, Clock, FileText } from "lucide-react"
import { PremierButton } from "@/components/ui/premier-button"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-premier-dark">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-premier-gold/10 backdrop-blur-md bg-premier-black/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-premier-gold" />
            <span className="text-xl font-bold bg-premier-gold bg-clip-text text-transparent">Looper HQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <PremierButton variant="ghost">Login</PremierButton>
            </Link>
            <Link href="/register">
              <PremierButton variant="primary">Get Started</PremierButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-premier-gold via-premier-gold-champagne to-premier-gold bg-clip-text text-transparent">
            Unified Legal Case Management for Hong Kong
          </h1>
          <p className="text-lg text-premier-pearl-gray mb-8">
            Streamline your legal practice with Looper HQ - comprehensive case management, 
            client portals, and public case search in one powerful platform.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <PremierButton size="lg" variant="primary">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </PremierButton>
            </Link>
            <Link href="/case-search">
              <PremierButton size="lg" variant="outline">
                Search Cases
              </PremierButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-premier-gold">
            Everything you need to manage your legal practice
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard variant="gold" glow>
              <GlassCardHeader>
                <Scale className="h-10 w-10 text-premier-gold mb-2" />
                <GlassCardTitle>Case Management</GlassCardTitle>
                <GlassCardDescription>
                  Organize and track all your cases in one place with powerful tools
                </GlassCardDescription>
              </GlassCardHeader>
            </GlassCard>
            <GlassCard variant="gold" glow>
              <GlassCardHeader>
                <Users className="h-10 w-10 text-premier-gold mb-2" />
                <GlassCardTitle>Client Portal</GlassCardTitle>
                <GlassCardDescription>
                  Provide clients with secure access to their case information
                </GlassCardDescription>
              </GlassCardHeader>
            </GlassCard>
            <GlassCard variant="gold" glow>
              <GlassCardHeader>
                <Search className="h-10 w-10 text-premier-gold mb-2" />
                <GlassCardTitle>公開案件搜尋</GlassCardTitle>
                <GlassCardDescription>
                  每日自動更新香港法律案件資料，公眾可免費搜尋查閱
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="pt-4">
                <Link href="/case-search">
                  <PremierButton variant="outline" size="sm" className="w-full">
                    立即搜尋案件 <ArrowRight className="ml-2 h-3 w-3" />
                  </PremierButton>
                </Link>
              </GlassCardContent>
            </GlassCard>
            <GlassCard variant="gold" glow>
              <GlassCardHeader>
                <Shield className="h-10 w-10 text-premier-gold mb-2" />
                <GlassCardTitle>Secure & Compliant</GlassCardTitle>
                <GlassCardDescription>
                  Built with Hong Kong legal requirements and data protection in mind
                </GlassCardDescription>
              </GlassCardHeader>
            </GlassCard>
            <GlassCard variant="gold" glow>
              <GlassCardHeader>
                <Clock className="h-10 w-10 text-premier-gold mb-2" />
                <GlassCardTitle>Time Tracking</GlassCardTitle>
                <GlassCardDescription>
                  Track billable hours and generate invoices automatically
                </GlassCardDescription>
              </GlassCardHeader>
            </GlassCard>
            <GlassCard variant="gold" glow>
              <GlassCardHeader>
                <FileText className="h-10 w-10 text-premier-gold mb-2" />
                <GlassCardTitle>Document Management</GlassCardTitle>
                <GlassCardDescription>
                  Store and organize all case-related documents securely
                </GlassCardDescription>
              </GlassCardHeader>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4 text-premier-gold">Ready to get started?</h2>
          <p className="text-lg text-premier-pearl-gray mb-8">
            Join law firms across Hong Kong using Looper HQ to manage their practice
          </p>
          <Link href="/register">
            <PremierButton size="lg" variant="primary">
              Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </PremierButton>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-premier-gold/10 bg-premier-black/80 mt-auto">
        <div className="container flex flex-col gap-4 py-8 px-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-premier-pearl-gray">
            © {new Date().getFullYear()} Looper HQ. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="/terms" className="text-sm text-premier-pearl-gray hover:text-premier-gold transition-colors">
              Terms
            </a>
            <a href="/privacy" className="text-sm text-premier-pearl-gray hover:text-premier-gold transition-colors">
              Privacy
            </a>
            <a href="/contact" className="text-sm text-premier-pearl-gray hover:text-premier-gold transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
