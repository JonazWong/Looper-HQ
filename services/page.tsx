'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Database, FileText, Download, Clock, Activity, TrendingUp, ExternalLink } from 'lucide-react';

interface DatabaseStats {
  totalCases: number;
  todayNew: number;
  courtsCovered: number;
  formsCount: number;
  crawlerLastRun: string | null;
  systemStatus: 'healthy' | 'warning' | 'error';
}

interface SearchRecord {
  id: string;
  keyword: string;
  resultCount: number;
  searchedAt: string;
}

const HOT_TAGS_ZH = ['商業訴訟', '刑事案件', '家庭法', '物業糾紛', '勞工法', '公司法'];
const HOT_TAGS_EN = ['Commercial Litigation', 'Criminal', 'Family Law', 'Property', 'Employment', 'Corporate'];

export default function MemberDashboardPage() {
  const { data: session } = useSession();
  const pathname = usePathname() || '/';
  const isEn = pathname.startsWith('/en');
  const [stats, setStats] = useState<DatabaseStats>({
    totalCases: 0,
    todayNew: 0,
    courtsCovered: 8,
    formsCount: 0,
    crawlerLastRun: null,
    systemStatus: 'healthy',
  });
  const [recentSearches, setRecentSearches] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/stats/database');
        if (res.ok) {
          const data = await res.json();
          if (data.success) setStats(data.data);
        }
      } catch {
        // fallback: keep defaults
      }
      try {
        const res = await fetch('/api/search-history?limit=5');
        if (res.ok) {
          const data = await res.json();
          if (data.success) setRecentSearches(data.data);
        }
      } catch {
        // fallback: keep defaults
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const statusColor = {
    healthy: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  }[stats.systemStatus];

  const statusLabel = {
    healthy: isEn ? 'Healthy' : '正常',
    warning: isEn ? 'Warning' : '警告',
    error: isEn ? 'Error' : '錯誤',
  }[stats.systemStatus];

  const hotTags = isEn ? HOT_TAGS_EN : HOT_TAGS_ZH;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-premier-gold">
          {isEn ? 'Member Dashboard' : '會員資料庫'}
        </h1>
        <p className="text-premier-pearl-gray mt-1 text-sm">
          {isEn ? 'Welcome back, ' : '歡迎回來，'}
          {session?.user?.name || 'User'}
        </p>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <Search className="w-5 h-5" />,
            label: isEn ? "Today's Searches" : '今日搜尋次數',
            value: loading ? '-' : recentSearches.length,
          },
          {
            icon: <FileText className="w-5 h-5" />,
            label: isEn ? 'Saved Documents' : '已儲存文件數',
            value: '0',
          },
          {
            icon: <Download className="w-5 h-5" />,
            label: isEn ? 'Downloaded PDFs' : '已下載 PDF 數',
            value: '0',
          },
          {
            icon: <Activity className="w-5 h-5" />,
            label: isEn ? 'Membership Tier' : '會員等級',
            value: isEn ? 'Public' : '公眾版',
          },
        ].map((card, i) => (
          <div key={i} className="glass-card rounded-premier-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-premier-pearl-gray text-xs">{card.label}</span>
              <span className="text-premier-gold">{card.icon}</span>
            </div>
            <div className="text-2xl font-bold text-premier-pearl">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Search */}
      <div className="glass-card rounded-premier-lg p-6">
        <h2 className="text-lg font-semibold text-premier-gold mb-4">
          {isEn ? 'Search Database' : '搜尋資料庫'}
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 bg-premier-black-light border border-premier-gold/20 rounded-premier-md px-4 py-3 text-premier-pearl placeholder-premier-pearl-gray focus:outline-none focus:border-premier-gold transition-colors"
            placeholder={isEn ? 'Enter keywords, case number, court...' : '輸入關鍵字、案件編號、法院...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                const link = (e.currentTarget.parentElement as HTMLElement | null)?.querySelector<HTMLAnchorElement>('[data-role="quick-search-link"]');
                link?.click();
              }
            }}
          />
          <Link
            href={`/case-search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-premier-gold to-premier-gold-rose text-premier-black rounded-premier-md font-medium hover:shadow-premier-glow transition-all"
            data-role="quick-search-link"
          >
            <Search className="w-4 h-4" />
            {isEn ? 'Search' : '搜尋'}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {hotTags.map(tag => (
            <Link
              key={tag}
              href={`/case-search?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1 text-xs rounded-full border border-premier-gold/20 text-premier-pearl-gray hover:border-premier-gold hover:text-premier-gold transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card rounded-premier-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-premier-gold">
              {isEn ? 'Recent Searches' : '最近查閱記錄'}
            </h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-premier-black-light rounded-premier-md animate-pulse" />
              ))}
            </div>
          ) : recentSearches.length === 0 ? (
            <p className="text-premier-pearl-gray text-sm">
              {isEn ? 'No recent searches.' : '尚無搜尋記錄。'}
            </p>
          ) : (
            <div className="space-y-3">
              {recentSearches.map(record => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b border-premier-gold/10 last:border-0">
                  <div>
                    <p className="text-premier-pearl text-sm font-medium">{record.keyword}</p>
                    <p className="text-premier-pearl-gray text-xs mt-0.5">
                      {record.resultCount} {isEn ? 'results' : '項結果'} · {new Date(record.searchedAt).toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/case-search?q=${encodeURIComponent(record.keyword)}`} className="text-premier-gold hover:text-premier-gold-champagne">
                    <Search className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Database Latest Updates */}
        <div className="glass-card rounded-premier-lg p-6">
          <h2 className="text-lg font-semibold text-premier-gold mb-4">
            {isEn ? 'Database Updates' : '資料庫最新更新'}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-premier-gold/10">
              <span className="text-premier-pearl-gray text-sm">{isEn ? "Today's New Cases" : '今日新增案件數'}</span>
              <span className="text-premier-gold font-bold">{loading ? '-' : stats.todayNew}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-premier-gold/10">
              <span className="text-premier-pearl-gray text-sm">{isEn ? 'Total Cases' : '總法案數量'}</span>
              <span className="text-premier-gold font-bold">{loading ? '-' : stats.totalCases.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-premier-gold/10">
              <span className="text-premier-pearl-gray text-sm">{isEn ? 'Last Crawl' : '爬蟲最後運行'}</span>
              <span className="text-premier-pearl-gray text-sm">
                {stats.crawlerLastRun ? new Date(stats.crawlerLastRun).toLocaleString() : (isEn ? 'N/A' : '未知')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-premier-pearl-gray text-sm">{isEn ? 'System Status' : '系統健康狀態'}</span>
              <span className={`text-sm font-semibold flex items-center gap-1 ${statusColor}`}>
                <span className="w-2 h-2 rounded-full bg-current inline-block" />
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass-card rounded-premier-lg p-6">
        <h2 className="text-lg font-semibold text-premier-gold mb-4">
          {isEn ? 'Quick Links' : '快速連結'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Database className="w-5 h-5" />, label: isEn ? 'Case Database' : '瀏覽法案資料庫', href: '/case-search' },
            { icon: <FileText className="w-5 h-5" />, label: isEn ? 'Forms Repository' : '司法表格庫', href: '/case-search?filter=forms' },
            { icon: <TrendingUp className="w-5 h-5" />, label: isEn ? 'AI Smart Search' : 'AI 智能搜尋', href: '/case-search?mode=ai' },
          ].map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className="flex items-center gap-3 p-4 border border-premier-gold/20 rounded-premier-md hover:border-premier-gold hover:bg-premier-gold/5 transition-all group"
            >
              <span className="text-premier-gold">{link.icon}</span>
              <span className="text-premier-pearl group-hover:text-premier-gold transition-colors text-sm font-medium">{link.label}</span>
              <ExternalLink className="w-3 h-3 text-premier-pearl-gray ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
