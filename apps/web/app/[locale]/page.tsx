import Link from "next/link"
import { ArrowRight, Scale, Shield, Search, Users, Clock, FileText, Brain, Globe } from "lucide-react"
import { PremierButton } from "@/components/ui/premier-button"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-premier-black via-premier-black-medium to-premier-black">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-premier-gold/10 backdrop-blur-md bg-premier-black/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-premier-gold" />
            <span className="text-xl font-serif font-bold text-gradient-gold">Looper HQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/login`}>
              <PremierButton variant="ghost">會員登入</PremierButton>
            </Link>
            <Link href={`/${locale}/register`}>
              <PremierButton variant="primary">立即開始</PremierButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-gradient-gold mb-4">
            Looper HQ
          </h1>
          <p className="text-xl text-premier-pearl-gray mb-8">
            香港法律案例智能搜尋平台
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={`/${locale}/register`}>
              <PremierButton size="lg" variant="primary">
                立即開始 <ArrowRight className="ml-2 h-4 w-4" />
              </PremierButton>
            </Link>
            <Link href={`/${locale}/login`}>
              <PremierButton size="lg" variant="ghost">
                會員登入
              </PremierButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <GlassCard variant="gold" glow>
              <GlassCardHeader>
                <Brain className="h-12 w-12 text-premier-gold mb-4" />
                <GlassCardTitle className="text-xl">AI 智能分類</GlassCardTitle>
                <GlassCardDescription>
                  自動分析案例，準確率 95%
                </GlassCardDescription>
              </GlassCardHeader>
            </GlassCard>
            <GlassCard variant="gold" glow>
              <GlassCardHeader>
                <Search className="h-12 w-12 text-premier-mystery-violet mb-4" />
                <GlassCardTitle className="text-xl">全文搜索</GlassCardTitle>
                <GlassCardDescription>
                  中英文混合查詢，{'<'}200ms 響應
                </GlassCardDescription>
              </GlassCardHeader>
            </GlassCard>
            <GlassCard variant="gold" glow>
              <GlassCardHeader>
                <Globe className="h-12 w-12 text-premier-gold mb-4" />
                <GlassCardTitle className="text-xl">雙語切換</GlassCardTitle>
                <GlassCardDescription>
                  繁體中文/英文即時切換
                </GlassCardDescription>
              </GlassCardHeader>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container px-4 py-16">
        <h2 className="text-4xl font-serif font-bold text-gradient-gold text-center mb-12">會員方案</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-2xl">訪客</GlassCardTitle>
              <div className="text-4xl font-bold text-premier-pearl mt-4">免費</div>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 mb-6 text-premier-pearl-gray">
                <li>✓ 每日 5 次搜尋</li>
                <li>✗ AI 分類</li>
              </ul>
              <Link href={`/${locale}/case-search`} className="block">
                <PremierButton variant="ghost" className="w-full">立即體驗</PremierButton>
              </Link>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="gold" glow className="border-2">
            <GlassCardHeader>
              <GlassCardTitle className="text-2xl">註冊會員</GlassCardTitle>
              <div className="text-4xl font-bold text-premier-gold mt-4">免費</div>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 mb-6 text-premier-pearl-gray">
                <li>✓ 每日 50 次搜尋</li>
                <li>✓ AI 智能分類</li>
              </ul>
              <Link href={`/${locale}/register`} className="block">
                <PremierButton variant="primary" className="w-full">免費註冊</PremierButton>
              </Link>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-2xl">付費會員</GlassCardTitle>
              <div className="text-4xl font-bold text-premier-mystery-violet mt-4">$99/月</div>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 mb-6 text-premier-pearl-gray">
                <li>✓ 無限搜尋</li>
                <li>✓ 導出 PDF/Excel</li>
              </ul>
              <Link href={`/${locale}/register?plan=premium`} className="block">
                <PremierButton variant="mystery" className="w-full">立即升級</PremierButton>
              </Link>
            </GlassCardContent>
          </GlassCard>
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
