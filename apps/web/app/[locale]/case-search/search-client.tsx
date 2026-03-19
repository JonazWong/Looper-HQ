'use client';

/**
 * Enhanced Client Component for Public Case Search
 *
 * Phase 4 additions:
 *  - Advanced query syntax (court:CFI AND year:2024)
 *  - Faceted search sidebar
 *  - Applied filter chips
 *  - Autocomplete dropdown on search input
 *  - ts_headline / substring highlighted snippets
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import {
  Search as SearchIcon,
  FileText,
  Calendar,
  ExternalLink,
  Building2,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  SlidersHorizontal,
  X,
  Scale,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PremierButton } from '@/components/ui/premier-button';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from '@/components/ui/glass-card';
import { FacetPanel, type Facets, type ActiveFacets } from '@/components/search/facet-panel';
import { AutocompleteInput } from '@/components/search/autocomplete-input';
import { HighlightedText } from '@/components/search/highlighted-text';
import { sanitiseHighlight, highlightTokens } from '@/lib/utils/highlight';

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
  // Highlight fields from ts_headline
  highlight_title?: string;
  highlight_description?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const EMPTY_FACETS: Facets = { courts: [], years: [], categories: [], judges: [] };

export function CaseSearchClient() {
  const searchParams = useSearchParams();
  const params = useParams();

  const [cases, setCases] = useState<PublicCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);
  const [showFacets, setShowFacets] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
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
    judge: searchParams.get('judge') || '',
    year: searchParams.get('year') || '',
    courtLevel: searchParams.get('courtLevel') || '',
  });

  const handleSearch = useCallback(
    async (page = 1) => {
      setLoading(true);

      try {
        const urlParams = new URLSearchParams({
          ...(filters.query && { query: filters.query }),
          ...(filters.source && { source: filters.source }),
          ...(filters.category && { category: filters.category }),
          ...(filters.court && { court: filters.court }),
          ...(filters.judge && { judge: filters.judge }),
          ...(filters.year && { year: filters.year }),
          ...(filters.courtLevel && { courtLevel: filters.courtLevel }),
          page: page.toString(),
          limit: '20',
          includeFacets: 'true',
          highlight: 'true',
        });

        // Only add mode when there's a query
        if (filters.query) {
          urlParams.append('mode', 'fulltext');
        }

        const response = await fetch(`/api/public-cases?${urlParams}`);
        const data = await response.json();

        if (data.success) {
          setCases(data.data.cases);
          setPagination(data.data.pagination);
          if (data.data.facets) {
            setFacets(data.data.facets);
            // Auto-show facets sidebar if we have useful facet data
            if (
              data.data.facets.courts.length > 0 ||
              data.data.facets.years.length > 0 ||
              data.data.facets.categories.length > 0 ||
              data.data.facets.judges.length > 0
            ) {
              setShowFacets(true);
            }
          }
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
    },
    [filters],
  );

  useEffect(() => {
    handleSearch(1);
  }, [handleSearch]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFacetChange = (key: keyof ActiveFacets, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSearch(1);
  };

  // Compute free-text tokens for client-side highlight fallback
  const freeTextTokens = filters.query
    ? filters.query
        .split(/\s+/)
        .filter((t) => t.length > 0 && !t.includes(':'))
    : [];

  const getTitle = (case_: PublicCase): string =>
    case_.highlight_title
      ? sanitiseHighlight(case_.highlight_title)
      : freeTextTokens.length
      ? highlightTokens(case_.title, freeTextTokens)
      : case_.title;

  const getDescription = (case_: PublicCase): string | null => {
    if (!case_.description) return null;
    if (case_.highlight_description)
      return sanitiseHighlight(case_.highlight_description);
    if (freeTextTokens.length)
      return highlightTokens(case_.description, freeTextTokens);
    return null;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      HK_JUDICIARY: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      SCMP_RSS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      RTHK_RSS: 'bg-green-500/20 text-green-400 border-green-500/30',
      APPLE_DAILY_RSS: 'bg-red-500/20 text-red-400 border-red-500/30',
      HKLII: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[source] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Active filters for chips display
  const activeFilters = [
    filters.source && { key: 'source', label: '來源', value: filters.source },
    filters.category && { key: 'category', label: '類別', value: filters.category },
    filters.court && { key: 'court', label: '法院', value: filters.court },
    filters.judge && { key: 'judge', label: '法官', value: filters.judge },
    filters.year && { key: 'year', label: '年份', value: filters.year },
    filters.courtLevel && { key: 'courtLevel', label: '法院層級', value: filters.courtLevel },
  ].filter(Boolean) as Array<{ key: string; label: string; value: string }>;

  const activeFacets: ActiveFacets = {
    court: filters.court,
    year: filters.year,
    category: filters.category,
    judge: filters.judge,
  };

  return (
    <>
      {/* Search Form */}
      <GlassCard variant="gold" className="mb-6">
        <GlassCardContent className="pt-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Main search row */}
            <div className="flex gap-3">
              <AutocompleteInput
                value={filters.query}
                onChange={(v) => handleFilterChange('query', v)}
                onSubmit={() => handleSearch(1)}
                placeholder="搜尋案件… 支援 court:CFI AND year:2024"
                disabled={loading}
              />
              <PremierButton type="submit" variant="primary" size="lg" disabled={loading}>
                <SearchIcon className="mr-2 h-5 w-5" />
                {loading ? '搜尋中...' : '搜尋'}
              </PremierButton>
              <PremierButton
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => setShowFacets(!showFacets)}
                className="border border-premier-gold/20"
                title="篩選"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </PremierButton>
            </div>

            {/* Advanced Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <option value="HKLII">香港法律資訊研究中心</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-premier-pearl-gray mb-2 block">案件類別</label>
                <input
                  type="text"
                  placeholder="例如：刑事、民事..."
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-premier-black/40 border border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-dark focus:border-premier-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-premier-pearl-gray mb-2 block">法院</label>
                <input
                  type="text"
                  placeholder="例如：高等法院..."
                  value={filters.court}
                  onChange={(e) => handleFilterChange('court', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-premier-black/40 border border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-dark focus:border-premier-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-premier-pearl-gray mb-2 block">法院層級</label>
                <select
                  value={filters.courtLevel}
                  onChange={(e) => handleFilterChange('courtLevel', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-premier-black/40 border border-premier-gold/20 text-premier-pearl focus:border-premier-gold focus:outline-none"
                >
                  <option value="">所有層級</option>
                  <option value="CFA">終審法院 (CFA)</option>
                  <option value="CA">上訴法庭 (CA)</option>
                  <option value="CFI">原訟法庭 (CFI)</option>
                  <option value="DC">區域法院 (DC)</option>
                  <option value="FC">家事法庭 (FC)</option>
                  <option value="MC">裁判法院 (MC)</option>
                  <option value="LT">土地審裁處 (LT)</option>
                  <option value="LABOUR">勞資審裁處</option>
                  <option value="SAR">小額錢債審裁處</option>
                  <option value="COMPETITION">競爭事務審裁處</option>
                </select>
              </div>
            </div>

            {/* Applied filter chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-premier-pearl-gray">已套用篩選：</span>
                {activeFilters.map((f) => (
                  <span
                    key={f.key}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-premier-gold/10 text-premier-gold border border-premier-gold/30"
                  >
                    {f.label}: {f.value}
                    <button
                      type="button"
                      onClick={() => handleFilterChange(f.key, '')}
                      className="hover:text-premier-gold/80"
                      aria-label={`移除 ${f.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ query: filters.query, source: '', category: '', court: '', judge: '', year: '', courtLevel: '' });
                  }}
                  className="text-xs text-premier-pearl-gray hover:text-premier-pearl underline"
                >
                  清除全部
                </button>
              </div>
            )}
          </form>
        </GlassCardContent>
      </GlassCard>

      {/* Results area: facets sidebar + results list */}
      <div className={`flex gap-6 ${showFacets ? 'items-start' : ''}`}>
        {/* Facet Sidebar */}
        {showFacets && (
          <aside className="w-56 flex-shrink-0">
            <GlassCard>
              <GlassCardContent className="py-4 px-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-premier-pearl">篩選維度</h3>
                  <button
                    type="button"
                    onClick={() => setShowFacets(false)}
                    className="text-premier-pearl-gray hover:text-premier-pearl"
                    aria-label="關閉篩選"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <FacetPanel
                  facets={facets}
                  active={activeFacets}
                  onChange={handleFacetChange}
                />
              </GlassCardContent>
            </GlassCard>
          </aside>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-premier-gold" />
              <p className="mt-4 text-premier-pearl-gray">正在搜尋...</p>
            </div>
          ) : (
            <>
              {/* Results Header */}
              {cases.length > 0 && (
                <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <p className="text-premier-pearl-gray">
                      找到{' '}
                      <span className="text-premier-gold font-semibold">{pagination.total}</span>{' '}
                      個結果
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
                  cases.map((case_) => {
                    const titleHtml = getTitle(case_);
                    const descHtml = getDescription(case_);

                    return (
                      <GlassCard
                        key={case_.id}
                        variant="mystery"
                        className="hover:border-premier-gold/40 transition-colors"
                      >
                        <GlassCardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                                <HighlightedText html={titleHtml} />
                              </GlassCardTitle>
                              {descHtml ? (
                                <GlassCardDescription className="line-clamp-3">
                                  <HighlightedText html={descHtml} />
                                </GlassCardDescription>
                              ) : case_.description ? (
                                <GlassCardDescription className="line-clamp-3">
                                  {case_.description}
                                </GlassCardDescription>
                              ) : null}
                            </div>
                            {case_.sourceUrl && (
                              <a
                                href={case_.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-premier-gold/10 hover:bg-premier-gold/20 transition-colors flex-shrink-0"
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
                            {case_.judge && (
                              <div className="flex items-center gap-2">
                                <Scale className="h-4 w-4 text-premier-pearl-dark" />
                                <span className="text-premier-pearl-gray">{case_.judge}</span>
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
                                <span className="text-premier-pearl-gray">
                                  判決：{formatDate(case_.judgmentDate)}
                                </span>
                              </div>
                            )}
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
                    );
                  })
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
                          variant={pageNum === pagination.page ? 'primary' : 'ghost'}
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
        </div>
      </div>
    </>
  );
}
