import Link from "next/link"
import { ArrowRight, Scale, Shield, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Looper HQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/login`}>
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href={`/${locale}/register`}>
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Unified Legal Case Management for Hong Kong
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Streamline your legal practice with Looper HQ - comprehensive case management, 
            client portals, and public case search in one powerful platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={`/${locale}/register`}>
              <Button size="lg">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/${locale}/case-search`}>
              <Button size="lg" variant="outline">
                Search Cases
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16 bg-muted/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage your legal practice
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Scale className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Case Management</CardTitle>
                <CardDescription>
                  Organize and track all your cases in one place with powerful tools
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Client Portal</CardTitle>
                <CardDescription>
                  Provide clients with secure access to their case information
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Public Case Search</CardTitle>
                <CardDescription>
                  Enable public search of case records with privacy controls
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Secure & Compliant</CardTitle>
                <CardDescription>
                  Built with Hong Kong legal requirements and data protection in mind
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Time Tracking</CardTitle>
                <CardDescription>
                  Track billable hours and generate invoices automatically
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Store and organize all case-related documents securely
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join law firms across Hong Kong using Looper HQ to manage their practice
          </p>
          <Link href={`/${locale}/register`}>
            <Button size="lg">
              Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="container flex flex-col gap-4 py-8 px-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Looper HQ. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </a>
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </a>
            <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
