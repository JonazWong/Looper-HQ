'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search as SearchIcon,
  FileText,
  Calendar,
  ExternalLink,
  Filter,
  Newspaper,
  Scale,
  Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GlassCard, 
  GlassCardHeader, 
  GlassCardTitle, 
  GlassCardDescription, 
  GlassCardContent 
} from "@/components/ui/glass-card";
import { AutoLinkText, CaseLinksList } from "@/lib/case-linking/use-case-linking";

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

export default function PublicCasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    source: searchParams.get('source') || '',
    category: searchParams.get('category') || '',
    court: searchParams.get('court') || '',
  });

  const handleSearch = async (page = 1) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        ...(filters.query && { query: filters.query }),
        ...(filters.source && { source: filters.source }),
        ...(filters.category && { category: filters.category }),
        ...(filters.court && { court: filters.court }),
        page: page.toString(),
        limit: '20'
      });
      
      const response = await fetch(`/api/public-cases?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCases(data.data.cases);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ query: '', source: '', category: '', court: '' });
  };

  const getSourceBadgeColor = (source: string): string => {
    const colors: Record<string, string> = {
      'HK_JUDICIARY': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'SCMP_RSS': 'bg-green-500/20 text-green-400 border-green-500/30',
      'RTHK_RSS': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'HKLII': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[source] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatSourceName = (source: string): string => {
    const names: Record<string, string> = {
      'HK_JUDICIARY': '香港司法機構',
      'SCMP_RSS': '南華早報',
      'RTHK_RSS': '香港電台',
      'APPLE_DAILY_RSS': '蘋果日報 (已停刊)',
      'HKLII': 'HKLII'
    };
    return names[source] || source;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Newspaper className="h-10 w-10 text-premier-gold" />
          <h1 className="text-4xl font-bold tracking-tight text-gradient-gold">
            公開案件搜尋
          </h1>
        </div>
        <p className="text-premier-pearl-gray text-lg">
          搜尋香港法律案件與新聞報導
        </p>
      </div>

      {/* Search & Filters */}
      <GlassCard variant="gold">
        <GlassCardContent className="pt-6">
          <div className="space-y-4">
            {/* Main Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-premier-pearl-gray" />
                <Input
                  type="text"
                  placeholder="搜尋關鍵字、案件編號..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                  className="pl-10 bg-premier-black/50 border-premier-pearl-gray/20 text-premier-pearl"
                />
              </div>
              <Button 
                onClick={() => handleSearch(1)}
                disabled={loading}
                className="bg-premier-gold hover:bg-premier-gold/90 text-premier-black"
              >
                {loading ? '搜尋中...' : '搜尋'}
              </Button>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="px-4 py-2 rounded-md bg-premier-black/50 border border-premier-pearl-gray/20 text-premier-pearl"
              >
                <option value="">所有來源</option>
                <option value="HK_JUDICIARY">香港司法機構</option>
                <option value="SCMP_RSS">南華早報</option>
                <option value="RTHK_RSS">香港電台</option>
                <option value="HKLII">HKLII</option>
              </select>

              <Input
                type="text"
                placeholder="案件類別"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="bg-premier-black/50 border-premier-pearl-gray/20 text-premier-pearl"
              />

              <Input
                type="text"
                placeholder="法院名稱"
                value={filters.court}
                onChange={(e) => handleFilterChange('court', e.target.value)}
                className="bg-premier-black/50 border-premier-pearl-gray/20 text-premier-pearl"
              />
            </div>

            {/* Active Filters & Clear */}
            {(filters.query || filters.source || filters.category || filters.court) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-premier-pearl-gray">已套用篩選條件:</span>
                <div className="flex gap-2 flex-wrap">
                  {filters.query && (
                    <Badge variant="outline" className="bg-premier-gold/20 text-premier-gold border-premier-gold/30">
                      關鍵字: {filters.query}
                    </Badge>
                  )}
                  {filters.source && (
                    <Badge variant="outline" className="bg-premier-gold/20 text-premier-gold border-premier-gold/30">
                      來源: {formatSourceName(filters.source)}
                    </Badge>
                  )}
                  {filters.category && (
                    <Badge variant="outline" className="bg-premier-gold/20 text-premier-gold border-premier-gold/30">
                      類別: {filters.category}
                    </Badge>
                  )}
                  {filters.court && (
                    <Badge variant="outline" className="bg-premier-gold/20 text-premier-gold border-premier-gold/30">
                      法院: {filters.court}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-premier-pearl-gray hover:text-premier-gold"
                >
                  清除全部
                </Button>
              </div>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Results Count */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-premier-pearl-gray">
            找到 <span className="text-premier-gold font-semibold">{pagination.total}</span> 個結果
          </p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <GlassCard>
            <GlassCardContent className="py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-premier-gold mx-auto" />
                <p className="mt-4 text-premier-pearl-gray">搜尋中...</p>
              </div>
            </GlassCardContent>
          </GlassCard>
        ) : cases.length === 0 ? (
          <GlassCard>
            <GlassCardContent className="py-16">
              <div className="text-center">
                <SearchIcon className="mx-auto h-16 w-16 text-premier-pearl-gray opacity-50" />
                <h3 className="mt-4 text-xl font-semibold text-premier-pearl">
                  {filters.query || filters.source || filters.category || filters.court
                    ? '找不到符合的結果'
                    : '開始搜尋'}
                </h3>
                <p className="mt-2 text-premier-pearl-gray">
                  {filters.query || filters.source || filters.category || filters.court
                    ? '嘗試調整搜尋條件或篩選器'
                    : '輸入關鍵字或使用篩選器來搜尋案件'}
                </p>
              </div>
            </GlassCardContent>
          </GlassCard>
        ) : (
          <>
            {cases.map((caseItem) => (
              <GlassCard key={caseItem.id} className="hover:border-premier-gold/50 transition-colors">
                <GlassCardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={getSourceBadgeColor(caseItem.source)}
                        >
                          {formatSourceName(caseItem.source)}
                        </Badge>
                        {caseItem.category && (
                          <Badge variant="outline" className="bg-premier-purple/20 text-premier-purple border-premier-purple/30">
                            {caseItem.category}
                          </Badge>
                        )}
                      </div>
                      <GlassCardTitle className="text-xl mb-1">
                        <AutoLinkText text={caseItem.title} />
                      </GlassCardTitle>
                      {caseItem.caseNumber && (
                        <p className="text-sm text-premier-gold">
                          案件編號: <AutoLinkText text={caseItem.caseNumber} />
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCardHeader>
                
                <GlassCardContent className="space-y-4">
                  {caseItem.description && (
                    <p className="text-premier-pearl-gray">
                      <AutoLinkText text={caseItem.description} />
                    </p>
                  )}

                  {/* 相關案件連結清單 */}
                  {caseItem.description && (
                    <CaseLinksList 
                      text={`${caseItem.title} ${caseItem.description}`} 
                      showJudiciary={true}
                      showLegalRef={true}
                    />
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {caseItem.court && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-premier-gold" />
                        <span className="text-premier-pearl-gray">
                          {caseItem.court}
                        </span>
                      </div>
                    )}
                    {caseItem.judge && (
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-premier-gold" />
                        <span className="text-premier-pearl-gray">
                          {caseItem.judge}
                        </span>
                      </div>
                    )}
                    {(caseItem.judgmentDate || caseItem.publishedAt) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-premier-gold" />
                        <span className="text-premier-pearl-gray">
                          {formatDate(caseItem.judgmentDate || caseItem.publishedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {caseItem.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {caseItem.keywords.slice(0, 8).map((keyword, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 text-xs bg-premier-pearl-gray/10 text-premier-pearl-gray rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {caseItem.sourceUrl && (
                    <div className="pt-2 border-t border-premier-pearl-gray/10">
                      <a
                        href={caseItem.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-premier-gold hover:text-premier-gold/80 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        查看來源
                      </a>
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <GlassCard>
          <GlassCardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => handleSearch(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                variant="outline"
                className="border-premier-gold/30 text-premier-gold hover:bg-premier-gold/10"
              >
                上一頁
              </Button>

              <span className="text-premier-pearl-gray">
                第 {pagination.page} / {pagination.totalPages} 頁
              </span>

              <Button
                onClick={() => handleSearch(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                variant="outline"
                className="border-premier-gold/30 text-premier-gold hover:bg-premier-gold/10"
              >
                下一頁
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
