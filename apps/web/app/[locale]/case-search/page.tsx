/**
 * Public Case Search Page (Public Access - No Login Required)
 * 公開案件搜尋頁面 - 客戶可在此查看每日更新的法律案件資料
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { 
  Scale,
  ArrowLeft
} from "lucide-react";
import { PremierButton } from "@/components/ui/premier-button";
import { CaseSearchClient } from './search-client';

export default async function PublicCasesPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-premier-dark">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-premier-gold/10 backdrop-blur-md bg-premier-black/80">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5 text-premier-gold" />
            <Scale className="h-6 w-6 text-premier-gold" />
            <span className="text-xl font-bold bg-premier-gold bg-clip-text text-transparent">Looper HQ</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/login`}>
              <PremierButton variant="ghost">Login</PremierButton>
            </Link>
            <Link href={`/${locale}/register`}>
              <PremierButton variant="primary">Get Started</PremierButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Page Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center gap-3">
            <Scale className="h-12 w-12 text-premier-gold" />
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-premier-gold via-premier-gold-champagne to-premier-gold bg-clip-text text-transparent">
              香港法律案件搜尋
            </h1>
          </div>
          <p className="text-xl text-premier-pearl-gray max-w-2xl mx-auto">
            搜尋每日更新的香港法律案件、判決書及法律新聞
          </p>
          <p className="text-sm text-premier-pearl-dark">
            資料來源：香港司法機構、本地新聞媒體、法律資料庫
          </p>
        </div>

        {/* Search Section with Suspense */}
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-premier-gold"></div>
            <p className="mt-4 text-premier-pearl-gray">載入中...</p>
          </div>
        }>
          <CaseSearchClient />
        </Suspense>

        {/* Footer Info */}
        <div className="mt-12 pt-8 border-t border-premier-gold/10 text-center">
          <p className="text-sm text-premier-pearl-dark">
            資料每日自動更新 | 如需專業法律服務，請{' '}
            <Link href={`/${locale}/register`} className="text-premier-gold hover:underline">
              註冊帳號
            </Link>
            {' '}或{' '}
            <Link href={`/${locale}/login`} className="text-premier-gold hover:underline">
              登入
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}