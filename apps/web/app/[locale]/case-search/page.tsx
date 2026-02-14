'use client';

/**
 * Public Case Search Page (Public Access - No Login Required)
 * 公開案件搜尋頁面 - 客戶可在此查看每日更新的法律案件資料
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { 
  Search as SearchIcon,
  FileText,
  Calendar,
  ExternalLink,
  Filter,
  Scale,
  Building2,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PremierButton } from "@/components/ui/premier-button";
import { Input } from "@/components/ui/input";
import { 
  GlassCard, 
  GlassCardHeader, 
  GlassCardTitle, 
  GlassCardDescription, 
  GlassCardContent 
} from "@/components/ui/glass-card";

interface PublicCase {
  id: string;
  source: string;
  externalId: string;
  sourceUrl?: string;
  caseNumber?: string;
  title: string;
  description?: string;
  category?: string;
  court?: string;
  judge?: string;
  judgmentDate?: string;
  publishedAt?: string;
  author?: string;
  keywords: string[];
  tags: string[];
  crawledAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SearchResponseData {
  cases: PublicCase[];
  pagination: PaginationData;
  took?: number; // Search time in milliseconds
  mode?: string; // Search mode used
}

export default function PublicCasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [searchPerformance, setSearchPerformance] = useState<{
    took: number;
    mode: string;
  } | null>(null);
  
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    source: searchParams.get('source') || '',
    category: searchParams.get('category') || '',
    court: searchParams.get('court') || '',
  });

  const handleSearch = useCallback(async (page = 1) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        ...(filters.query && { query: filters.query }),
        ...(filters.source && { source: filters.source }),
        ...(filters.category && { category: filters.category }),
        ...(filters.court && { court: filters.court }),
        page: page.toString(),
        limit: '20',
      });
      
      // Only add mode when there's a query
      if (filters.query) {
        params.append('mode', 'fulltext');
      }
      
      const response = await fetch(`/api/public-cases?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCases(data.data.cases);
        setPagination(data.data.pagination);
        // Store search performance metrics
        if (data.data.took !== undefined) {
          setSearchPerformance({
            took: data.data.took,
            mode: data.data.mode || 'simple',
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    handleSearch(1);
  }, [handleSearch]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      'HK_JUDICIARY': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'SCMP_RSS': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'RTHK_RSS': 'bg-green-500/20 text-green-400 border-green-500/30',
      'APPLE_DAILY_RSS': 'bg-red-500/20 text-red-400 border-red-500/30',
      'HKLII': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[source] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

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

        {/* Search Form */}
        <GlassCard variant="gold" className="mb-8">
          <GlassCardContent className="pt-6">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-premier-pearl-dark" />
                  <Input
                    type="text"
                    placeholder="輸入案件編號、標題或關鍵字..."
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    className="pl-10 bg-premier-black/40 border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-dark focus:border-premier-gold"
                  />
                </div>
                <PremierButton type="submit" variant="primary" size="lg" disabled={loading}>
                  <SearchIcon className="mr-2 h-5 w-5" />
                  {loading ? '搜尋中...' : '搜尋'}
                </PremierButton>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-premier-pearl-gray mb-2 block">資料來源</label>
                  <select
                    value={filters.source}
                    onChange={(e) => handleFilterChange('source', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-premier-black/40 border border-premier-gold/20 text-premier-pearl focus:border-premier-gold focus:outline-none"
                  >
                    <option value="">全部來源</option>
                    <option value="HK_JUDICIARY">香港司法機構</option>
                    <option value="SCMP_RSS">南華早報</option>
                    <option value="RTHK_RSS">香港電台</option>
                    <option value="HKLII">香港法律資訊中心</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-premier-pearl-gray mb-2 block">案件類別</label>
                  <Input
                    type="text"
                    placeholder="例如：刑事、民事..."
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="bg-premier-black/40 border-premier-gold/20 text-premier-pearl"
                  />
                </div>

                <div>
                  <label className="text-sm text-premier-pearl-gray mb-2 block">法院</label>
                  <Input
                    type="text"
                    placeholder="例如：高等法院..."
                    value={filters.court}
                    onChange={(e) => handleFilterChange('court', e.target.value)}
                    className="bg-premier-black/40 border-premier-gold/20 text-premier-pearl"
                  />
                </div>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>

        {/* Search Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-premier-gold"></div>
            <p className="mt-4 text-premier-pearl-gray">正在搜尋...</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            {cases.length > 0 && (
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-premier-pearl-gray">
                    找到 <span className="text-premier-gold font-semibold">{pagination.total}</span> 個結果
                  </p>
                  {searchPerformance && searchPerformance.took > 0 && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {searchPerformance.took}ms
                    </Badge>
                  )}
                  {searchPerformance && searchPerformance.mode && searchPerformance.mode !== 'simple' && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {searchPerformance.mode}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-premier-pearl-dark">
                  第 {pagination.page} 頁，共 {pagination.totalPages} 頁
                </p>
              </div>
            )}

            {/* Case Cards */}
            <div className="space-y-4">
              {cases.length === 0 ? (
                <GlassCard>
                  <GlassCardContent className="py-12 text-center">
                    <FileText className="h-16 w-16 text-premier-pearl-dark mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-premier-pearl mb-2">未找到案件</h3>
                    <p className="text-premier-pearl-gray">請嘗試不同的搜尋條件</p>
                  </GlassCardContent>
                </GlassCard>
              ) : (
                cases.map((case_) => (
                  <GlassCard key={case_.id} variant="mystery" className="hover:border-premier-gold/40 transition-colors">
                    <GlassCardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSourceBadgeColor(case_.source)}>
                              {case_.source.replace('_', ' ')}
                            </Badge>
                            {case_.caseNumber && (
                              <Badge className="bg-premier-gold/20 text-premier-gold border-premier-gold/30">
                                {case_.caseNumber}
                              </Badge>
                            )}
                          </div>
                          <GlassCardTitle className="text-2xl mb-2">
                            {case_.title}
                          </GlassCardTitle>
                          {case_.description && (
                            <GlassCardDescription className="line-clamp-2">
                              {case_.description}
                            </GlassCardDescription>
                          )}
                        </div>
                        {case_.sourceUrl && (
                          <a 
                            href={case_.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-premier-gold/10 hover:bg-premier-gold/20 transition-colors"
                          >
                            <ExternalLink className="h-5 w-5 text-premier-gold" />
                          </a>
                        )}
                      </div>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {case_.court && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-premier-pearl-dark" />
                            <span className="text-premier-pearl-gray">{case_.court}</span>
                          </div>
                        )}
                        {case_.category && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-premier-pearl-dark" />
                            <span className="text-premier-pearl-gray">{case_.category}</span>
                          </div>
                        )}
                        {case_.judgmentDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-premier-pearl-dark" />
                            <span className="text-premier-pearl-gray">判決：{formatDate(case_.judgmentDate)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Newspaper className="h-4 w-4 text-premier-pearl-dark" />
                          <span className="text-premier-pearl-gray">更新：{formatDate(case_.crawledAt)}</span>
                        </div>
                      </div>

                      {case_.keywords.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {case_.keywords.slice(0, 5).map((keyword, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 text-xs rounded-full bg-premier-mystery/20 text-premier-mystery-purple border border-premier-mystery/30"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </GlassCardContent>
                  </GlassCard>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <PremierButton
                  variant="ghost"
                  onClick={() => handleSearch(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一頁
                </PremierButton>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PremierButton
                        key={pageNum}
                        variant={pageNum === pagination.page ? "primary" : "ghost"}
                        onClick={() => handleSearch(pageNum)}
                        disabled={loading}
                        size="sm"
                      >
                        {pageNum}
                      </PremierButton>
                    );
                  })}
                </div>

                <PremierButton
                  variant="ghost"
                  onClick={() => handleSearch(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                >
                  下一頁
                  <ChevronRight className="h-4 w-4 ml-1" />
                </PremierButton>
              </div>
            )}
          </>
        )}

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
