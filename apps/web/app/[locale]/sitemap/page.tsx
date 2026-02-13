/**
 * Site Navigation / Sitemap Page
 * 顯示所有可用頁面的導航頁面
 */

import Link from "next/link"
import { Home, Search, FileText, Lock, UserPlus, LogIn, LayoutDashboard } from "lucide-react"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { PremierButton } from "@/components/ui/premier-button"

export default function SitemapPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  return (
    <div className="min-h-screen bg-premier-dark p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-premier-gold via-premier-gold-champagne to-premier-gold bg-clip-text text-transparent">
            Looper HQ
          </h1>
          <p className="text-premier-pearl-gray text-lg">
            完整頁面導航 - Site Navigation
          </p>
        </div>

        {/* Public Pages */}
        <GlassCard variant="gold" glow>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-2xl">
              <Home className="h-6 w-6" />
              🔓 公開頁面（無需登入）
            </GlassCardTitle>
            <GlassCardDescription>
              Public Pages - No Authentication Required
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            <Link href={`/${locale}`} className="block">
              <div className="p-4 rounded-lg bg-premier-gold/10 hover:bg-premier-gold/20 transition-colors border border-premier-gold/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-premier-pearl">首頁 / Home Page</h3>
                    <p className="text-sm text-premier-pearl-gray">Premier Design 行銷首頁，展示系統功能</p>
                  </div>
                  <code className="text-premier-gold text-sm">/</code>
                </div>
              </div>
            </Link>

            <Link href={`/${locale}/landing`} className="block">
              <div className="p-4 rounded-lg bg-premier-gold/10 hover:bg-premier-gold/20 transition-colors border border-premier-gold/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-premier-pearl flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Landing Page
                    </h3>
                    <p className="text-sm text-premier-pearl-gray">替代首頁，簡約風格</p>
                  </div>
                  <code className="text-premier-gold text-sm">/landing</code>
                </div>
              </div>
            </Link>

            <Link href={`/${locale}/case-search`} className="block">
              <div className="p-4 rounded-lg bg-premier-gold/10 hover:bg-premier-gold/20 transition-colors border border-premier-gold/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-premier-pearl flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      公開案件搜尋 / Public Case Search
                    </h3>
                    <p className="text-sm text-premier-pearl-gray">每日更新的香港法律案件資料，公眾免費搜尋</p>
                  </div>
                  <code className="text-premier-gold text-sm">/case-search</code>
                </div>
              </div>
            </Link>

            <Link href={`/${locale}/sitemap`} className="block">
              <div className="p-4 rounded-lg bg-premier-gold/10 hover:bg-premier-gold/20 transition-colors border border-premier-gold/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-premier-pearl">Sitemap（當前頁面）</h3>
                    <p className="text-sm text-premier-pearl-gray">完整頁面導航</p>
                  </div>
                  <code className="text-premier-gold text-sm">/sitemap</code>
                </div>
              </div>
            </Link>
          </GlassCardContent>
        </GlassCard>

        {/* Auth Pages */}
        <GlassCard variant="mystery">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-2xl">
              <Lock className="h-6 w-6" />
              🔐 認證頁面
            </GlassCardTitle>
            <GlassCardDescription>
              Authentication Pages
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            <Link href={`/${locale}/login`} className="block">
              <div className="p-4 rounded-lg bg-premier-mystery/30 hover:bg-premier-mystery/40 transition-colors border border-premier-mystery/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-premier-pearl flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      登入 / Login
                    </h3>
                    <p className="text-sm text-premier-pearl-gray">
                      Demo: owner@wonglaw.hk / demo123456
                    </p>
                  </div>
                  <code className="text-premier-mystery text-sm">/login</code>
                </div>
              </div>
            </Link>

            <Link href={`/${locale}/register`} className="block">
              <div className="p-4 rounded-lg bg-premier-mystery/30 hover:bg-premier-mystery/40 transition-colors border border-premier-mystery/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-premier-pearl flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      註冊 / Register
                    </h3>
                    <p className="text-sm text-premier-pearl-gray">建立新帳戶</p>
                  </div>
                  <code className="text-premier-mystery text-sm">/register</code>
                </div>
              </div>
            </Link>
          </GlassCardContent>
        </GlassCard>

        {/* Dashboard Pages */}
        <GlassCard variant="gold">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-2xl">
              <LayoutDashboard className="h-6 w-6" />
              💼 Dashboard 功能頁面（需要登入）
            </GlassCardTitle>
            <GlassCardDescription>
              Protected Dashboard Pages - Authentication Required
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="bg-premier-gold/5 border border-premier-gold/20 rounded-lg p-4 mb-4">
              <p className="text-premier-pearl-gray text-sm mb-2">
                ⚠️ 以下頁面需要登入後才能訪問。未登入時會自動重定向到登入頁面。
              </p>
              <p className="text-premier-pearl text-sm font-semibold">
                登入後可透過 Dashboard 的 Sidebar 導航訪問所有功能。
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {[
                { path: '/dashboard', name: 'Dashboard 主頁', desc: '統計數據、最近案件、活動時間軸' },
                { path: '/dashboard/cases', name: '案件管理', desc: '案件列表、搜尋、篩選、新增' },
                { path: '/dashboard/clients', name: '客戶管理', desc: '客戶列表、管理客戶資料' },
                { path: '/dashboard/public-cases', name: '公開案件', desc: '智能案件連結、HKLII 連結' },
                { path: '/dashboard/search', name: '搜尋功能', desc: '進階搜尋與篩選' },
                { path: '/dashboard/documents', name: '文檔管理', desc: '上傳、管理案件文檔' },
                { path: '/dashboard/calendar', name: '行事曆', desc: '開庭日期、重要事件' },
                { path: '/dashboard/billing', name: '帳單管理', desc: '發票、付款追蹤' },
                { path: '/dashboard/time-tracking', name: '時間追蹤', desc: '計費時數記錄' },
                { path: '/dashboard/settings', name: '設定', desc: '系統設定、個人偏好' },
                { path: '/dashboard/test-case-linking', name: '案件連結測試', desc: '測試智能案件編號識別' },
              ].map((page) => (
                <div 
                  key={page.path}
                  className="p-3 rounded-lg bg-premier-gold/5 border border-premier-gold/10 hover:border-premier-gold/30 transition-colors"
                >
                  <h4 className="font-semibold text-premier-pearl text-sm mb-1">
                    {page.name}
                  </h4>
                  <p className="text-xs text-premier-pearl-gray mb-2">
                    {page.desc}
                  </p>
                  <code className="text-xs text-premier-gold opacity-70">{page.path}</code>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Quick Actions */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href={`/${locale}`}>
            <PremierButton variant="primary" size="lg">
              <Home className="mr-2 h-4 w-4" />
              返回首頁
            </PremierButton>
          </Link>
          <Link href={`/${locale}/login`}>
            <PremierButton variant="outline" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              登入系統
            </PremierButton>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-premier-pearl-gray border-t border-premier-gold/10 pt-6">
          <p>Looper HQ | 香港法律案件管理系統</p>
          <p className="text-xs mt-2">Running on http://localhost:3005</p>
        </div>
      </div>
    </div>
  )
}
