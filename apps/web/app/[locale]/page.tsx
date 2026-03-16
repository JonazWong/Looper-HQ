import Link from "next/link"
import { ArrowRight, Scale, Brain, Search, Globe, Database, Newspaper, Bot, FileText, Building2, CheckCircle2 } from "lucide-react"
import { PremierButton } from "@/components/ui/premier-button"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { ParticleBackground } from "@/components/effects/particle-background"
import { LanguageSwitcher } from "@/components/language-switcher"

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-premier-black via-premier-black-medium to-premier-black">
      <ParticleBackground particleCount={40} />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-premier-gold/10 backdrop-blur-md bg-premier-black/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-premier-gold" />
            <span className="text-xl font-serif font-bold text-gradient-gold">Looper HQ</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href={`/${locale}/login`}>
              <PremierButton variant="ghost">{isEn ? 'Login' : '會員登入'}</PremierButton>
            </Link>
            <Link href={`/${locale}/register`}>
              <PremierButton variant="primary">{isEn ? 'Get Started' : '立即開始'}</PremierButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container px-4 py-28 md:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-premier-gold/20 bg-premier-gold/5 text-premier-gold text-sm mb-8">
            <Bot className="h-4 w-4" />
            <span>{isEn ? 'AI-powered · Auto-updated · Daily crawling' : 'AI 驅動 · 自動更新 · 每日爬蟲'}</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-gradient-gold mb-4 leading-tight">
            {isEn ? 'Hong Kong Legal Case' : '香港法案智能'}
          </h1>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-premier-pearl mb-8 leading-tight">
            {isEn ? 'Intelligence Database' : '資料庫'}
          </h1>
          <p className="text-lg md:text-xl text-premier-pearl-gray mb-10 max-w-2xl mx-auto">
            {isEn
              ? 'Automated crawling from Hong Kong Judiciary, news sources and private databases. AI-classified, bilingual, updated daily.'
              : '自動爬取香港司法機構、新聞源及私營機構的法案資料。AI 智能分類，中英雙語，每日持續更新。'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={`/${locale}/case-search`}>
              <PremierButton size="lg" variant="primary">
                {isEn ? 'Search Cases' : '立即查閱法案'} <ArrowRight className="ml-2 h-4 w-4" />
              </PremierButton>
            </Link>
            <Link href={`#features`}>
              <PremierButton size="lg" variant="ghost">
                {isEn ? 'Learn More' : '了解更多'}
              </PremierButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="container px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { label: isEn ? 'Total Cases' : '總法案數量', value: '0', suffix: '+' },
            { label: isEn ? "Today's New Cases" : '今日新增', value: '0', suffix: '' },
            { label: isEn ? 'Courts Covered' : '覆蓋法院數', value: '8', suffix: '' },
            { label: isEn ? 'Forms Repository' : '表格庫數量', value: '0', suffix: '+' },
          ].map((stat, i) => (
            <GlassCard key={i} variant="gold" animated={false}>
              <div className="p-6 text-center">
                <div className="text-4xl font-bold text-premier-gold mb-2">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-premier-pearl-gray">{stat.label}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gradient-gold text-center mb-4">
            {isEn ? 'Core Features' : '核心功能'}
          </h2>
          <p className="text-premier-pearl-gray text-center mb-12 max-w-2xl mx-auto">
            {isEn
              ? 'Comprehensive tools for accessing and analysing Hong Kong legal cases'
              : '全面覆蓋香港法律案例的智能工具'}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Database className="h-10 w-10 text-premier-gold" />,
                title: isEn ? 'Case Database' : '法案資料庫',
                desc: isEn
                  ? 'Court judgments from all levels of HK courts, continuously updated'
                  : '覆蓋香港各級法院判決書，持續自動更新',
              },
              {
                icon: <Building2 className="h-10 w-10 text-premier-gold" />,
                title: isEn ? 'Judiciary Crawler' : '司法機構爬蟲',
                desc: isEn
                  ? 'Automated crawling of the latest cases from HK Judiciary website'
                  : '自動爬取香港司法機構網站最新法案',
              },
              {
                icon: <Newspaper className="h-10 w-10 text-premier-mystery-violet" />,
                title: isEn ? 'News Crawler' : '新聞源爬蟲',
                desc: isEn
                  ? 'Legal news aggregated from trusted Hong Kong news outlets'
                  : '從多個可信新聞源爬取法律相關資訊',
              },
              {
                icon: <Brain className="h-10 w-10 text-premier-gold" />,
                title: isEn ? 'AI Classification' : 'AI 智能分類',
                desc: isEn
                  ? 'AI automatically analyses and classifies case type, court and judge'
                  : 'AI 自動分析並分類每宗案件的類型、法院、法官',
              },
              {
                icon: <FileText className="h-10 w-10 text-premier-mystery-violet" />,
                title: isEn ? 'Forms Repository' : '司法表格庫',
                desc: isEn
                  ? 'Collection of all HK Judiciary forms, continuously updated'
                  : '搜集香港司法機構各類表格，持續更新',
              },
              {
                icon: <Search className="h-10 w-10 text-premier-gold" />,
                title: isEn ? 'Private Databases' : '私營機構數據',
                desc: isEn
                  ? 'Integrated access to private legal database sources'
                  : '整合私營機構法律資料庫',
              },
            ].map((feature, i) => (
              <GlassCard key={i} variant="gold" glow>
                <GlassCardHeader>
                  {feature.icon}
                  <GlassCardTitle className="text-lg mt-4">{feature.title}</GlassCardTitle>
                  <GlassCardDescription>{feature.desc}</GlassCardDescription>
                </GlassCardHeader>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sources Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-serif font-bold text-gradient-gold text-center mb-4">
            {isEn ? 'Data Sources' : '資料來源'}
          </h2>
          <p className="text-premier-pearl-gray text-center mb-10">
            {isEn ? 'Trusted and authoritative sources for Hong Kong legal data' : '香港法律資料的可信權威來源'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { emoji: '🏛️', label: 'High Court' },
              { emoji: '🏛️', label: 'District Court' },
              { emoji: '🏛️', label: "Magistrates' Court" },
              { emoji: '🏛️', label: 'Court of Final Appeal' },
              { emoji: '📰', label: isEn ? 'Ming Pao' : '明報' },
              { emoji: '📰', label: isEn ? 'HK Economic Journal' : '信報' },
              { emoji: '📁', label: isEn ? 'Private Databases' : '私營資料庫' },
              { emoji: '🤖', label: isEn ? 'AI Classification Engine' : 'AI 分類引擎' },
            ].map((source, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-premier-gold/20 bg-premier-gold/5 text-premier-pearl-gray text-sm"
              >
                <span>{source.emoji}</span>
                <span>{source.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-gradient-gold text-center mb-4">
          {isEn ? 'Subscription Plans' : '訂閱計劃'}
        </h2>
        <p className="text-premier-pearl-gray text-center mb-12">
          {isEn ? 'Choose a plan that suits your needs' : '選擇適合您需要的方案'}
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* 公眾版 */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-xl">{isEn ? 'Public' : '公眾版'}</GlassCardTitle>
              <div className="text-3xl font-bold text-premier-pearl mt-3">{isEn ? 'Free' : '免費'}</div>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 mb-6 text-sm text-premier-pearl-gray">
                {[
                  isEn ? 'Basic search' : '基礎搜尋',
                  isEn ? 'Daily update digest' : '每日更新摘要',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-premier-gold shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/case-search`} className="block">
                <PremierButton variant="ghost" className="w-full">{isEn ? 'Try Now' : '立即體驗'}</PremierButton>
              </Link>
            </GlassCardContent>
          </GlassCard>

          {/* 基本版 */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-xl">{isEn ? 'Basic' : '基本版'}</GlassCardTitle>
              <div className="text-3xl font-bold text-premier-pearl mt-3">HK$500<span className="text-base font-normal text-premier-pearl-gray">/{isEn ? 'mo' : '月'}</span></div>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 mb-6 text-sm text-premier-pearl-gray">
                {[
                  isEn ? 'Full search access' : '完整搜尋',
                  isEn ? 'PDF download' : 'PDF 下載',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-premier-gold shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/register?plan=basic`} className="block">
                <PremierButton variant="outline" className="w-full">{isEn ? 'Subscribe' : '訂閱'}</PremierButton>
              </Link>
            </GlassCardContent>
          </GlassCard>

          {/* 專業版 */}
          <GlassCard variant="gold" glow className="border-2 border-premier-gold/30">
            <GlassCardHeader>
              <div className="text-xs font-semibold text-premier-gold uppercase tracking-wider mb-1">{isEn ? 'Most Popular' : '最受歡迎'}</div>
              <GlassCardTitle className="text-xl">{isEn ? 'Professional' : '專業版'}</GlassCardTitle>
              <div className="text-3xl font-bold text-premier-gold mt-3">HK$1,500<span className="text-base font-normal text-premier-pearl-gray">/{isEn ? 'mo' : '月'}</span></div>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 mb-6 text-sm text-premier-pearl-gray">
                {[
                  isEn ? 'AI semantic search' : 'AI 語意搜尋',
                  isEn ? 'API access' : 'API 訪問',
                  isEn ? 'All Basic features' : '基本版全部功能',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-premier-gold shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/register?plan=professional`} className="block">
                <PremierButton variant="primary" className="w-full">{isEn ? 'Subscribe' : '訂閱'}</PremierButton>
              </Link>
            </GlassCardContent>
          </GlassCard>

          {/* 機構版 */}
          <GlassCard variant="mystery">
            <GlassCardHeader>
              <GlassCardTitle className="text-xl">{isEn ? 'Enterprise' : '機構版'}</GlassCardTitle>
              <div className="text-3xl font-bold text-premier-mystery-violet mt-3">{isEn ? 'Custom' : '按需報價'}</div>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="space-y-2 mb-6 text-sm text-premier-pearl-gray">
                {[
                  isEn ? 'Full features' : '完整功能',
                  isEn ? 'Bulk download' : '批量下載',
                  isEn ? 'Dedicated support' : '專屬服務',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-premier-mystery-violet shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/register?plan=enterprise`} className="block">
                <PremierButton variant="mystery" className="w-full">{isEn ? 'Contact Us' : '聯絡我們'}</PremierButton>
              </Link>
            </GlassCardContent>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-premier-gold/10 bg-premier-black/80 mt-auto">
        <div className="container flex flex-col gap-4 py-8 px-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-premier-gold" />
            <span className="text-sm text-premier-pearl-gray">
              © 2025 Looper-HQ · {isEn ? 'Hong Kong Legal Case Intelligence Database' : '香港法案智能資料庫'}
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-premier-pearl-gray hover:text-premier-gold transition-colors">
              {isEn ? 'Terms' : '條款'}
            </Link>
            <Link href="/privacy" className="text-sm text-premier-pearl-gray hover:text-premier-gold transition-colors">
              {isEn ? 'Privacy' : '隱私'}
            </Link>
            <Link href="/contact" className="text-sm text-premier-pearl-gray hover:text-premier-gold transition-colors">
              {isEn ? 'Contact' : '聯絡'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

