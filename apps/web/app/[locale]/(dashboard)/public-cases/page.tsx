'use client';

/**
 * Public Cases Page - Dashboard Version
 * Uses Phase 4 enhanced search with facets, autocomplete, and highlighting
 */

import { Suspense } from 'react';
import { Scale } from 'lucide-react';
import { CaseSearchClient } from '@/app/[locale]/case-search/search-client';

export default function PublicCasesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Scale className="h-10 w-10 text-premier-gold" />
          <h1 className="text-4xl font-bold tracking-tight text-gradient-gold">
            法律資料庫
          </h1>
        </div>
        <p className="text-premier-pearl-gray text-lg">
          搜尋香港法律案件、判決書與新聞報導
        </p>
      </div>

      {/* Phase 4 Search Client */}
      <Suspense fallback={
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-premier-gold mx-auto" />
          <p className="mt-4 text-premier-pearl-gray">載入中...</p>
        </div>
      }>
        <CaseSearchClient />
      </Suspense>
    </div>
  );
}
