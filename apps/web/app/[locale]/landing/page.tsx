import Link from "next/link"
import { ArrowRight, Scale, Shield, Search, Users, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LanguageSwitcher } from "@/components/language-switcher"
import { getTranslations } from "next-intl/server"

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });

  // Feature cards: which ones link to real pages vs. info-only
  const featureCards = [
    {
      icon: <Scale className="h-10 w-10 text-primary mb-2" />,
      title: t('features.caseManagement.title'),
      description: t('features.caseManagement.description'),
      href: `/${locale}/cases`,   // real page exists
    },
    {
      icon: <Users className="h-10 w-10 text-primary mb-2" />,
      title: t('features.clientPortal.title'),
      description: t('features.clientPortal.description'),
      href: `/${locale}/clients`, // real page exists
    },
    {
      icon: <Search className="h-10 w-10 text-primary mb-2" />,
      title: t('features.publicSearch.title'),
      description: t('features.publicSearch.description'),
      href: `/${locale}/case-search`, // real page exists
    },
    {
      icon: <Shield className="h-10 w-10 text-primary mb-2" />,
      title: t('features.secure.title'),
      description: t('features.secure.description'),
      href: null, // info-only, no dedicated page
    },
    {
      icon: <Clock className="h-10 w-10 text-primary mb-2" />,
      title: t('features.timeTracking.title'),
      description: t('features.timeTracking.description'),
      href: `/${locale}/time-tracking`, // real page exists
    },
    {
      icon: <FileText className="h-10 w-10 text-primary mb-2" />,
      title: t('features.documents.title'),
      description: t('features.documents.description'),
      href: `/${locale}/documents`, // real page exists
    },
  ]

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
            <LanguageSwitcher />
            <Link href={`/${locale}/login`}>
              <Button variant="ghost">{t('header.login')}</Button>
            </Link>
            <Link href={`/${locale}/register`}>
              <Button>{t('header.getStarted')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {t('hero.subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={`/${locale}/register`}>
              <Button size="lg">
                {t('hero.cta')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/${locale}/case-search`}>
              <Button size="lg" variant="outline">
                {t('hero.searchCases')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16 bg-muted/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('features.sectionTitle')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((card) =>
              card.href ? (
                <Link key={card.title} href={card.href} className="group">
                  <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                    <CardHeader>
                      {card.icon}
                      <CardTitle className="group-hover:text-primary transition-colors">{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ) : (
                <Card key={card.title} className="h-full opacity-90 cursor-default">
                  <CardHeader>
                    {card.icon}
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('cta.subtitle')}
          </p>
          <Link href={`/${locale}/register`}>
            <Button size="lg">
              {t('cta.button')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="container flex flex-col gap-4 py-8 px-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Looper HQ. {t('footer.rights')}
          </div>
          <div className="flex gap-4">
            <span className="text-sm text-muted-foreground">{t('footer.terms')}</span>
            <span className="text-sm text-muted-foreground">{t('footer.privacy')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
