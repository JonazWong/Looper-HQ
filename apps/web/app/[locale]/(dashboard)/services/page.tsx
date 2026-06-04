'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
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
  const locale = useLocale();
  const t = useTranslations();
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
    healthy: t('services.status.healthy'),
    warning: t('services.status.warning'),
    error: t('services.status.error'),
  }[stats.systemStatus];

  const hotTags = locale === 'en' ? HOT_TAGS_EN : HOT_TAGS_ZH;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-premier-gold">
          {t('services.title')}
        </h1>
        <p className="text-premier-pearl-gray mt-1 text-sm">
          {t('services.welcomeBack')} {session?.user?.name || t('services.guest')}
        </p>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <Search className="w-5 h-5" />,
            label: t('services.todaySearches'),
            value: loading ? '-' : recentSearches.length,
          },
          {
            icon: <FileText className="w-5 h-5" />,
            label: t('services.savedDocuments'),
            value: '0',
          },
          {
            icon: <Download className="w-5 h-5" />,
            label: t('services.downloadedPdfs'),
            value: '0',
          },
          {
            icon: <Activity className="w-5 h-5" />,
            label: t('services.membershipTier'),
            value: t('services.publicTier'),
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
          {t('services.searchDatabase')}
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 bg-premier-black-light border border-premier-gold/20 rounded-premier-md px-4 py-3 text-premier-pearl placeholder-premier-pearl-gray focus:outline-none focus:border-premier-gold transition-colors"
            placeholder={t('services.quickSearchPlaceholder')}
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
            href={`/${locale}/case-search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-premier-gold to-premier-gold-rose text-premier-black rounded-premier-md font-medium hover:shadow-premier-glow transition-all"
            data-role="quick-search-link"
          >
            <Search className="w-4 h-4" />
            {t('common.search')}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {hotTags.map(tag => (
            <Link
              key={tag}
              href={`/${locale}/case-search?q=${encodeURIComponent(tag)}`}
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
              {t('services.recentSearches')}
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
              {t('services.noRecentSearches')}
            </p>
          ) : (
            <div className="space-y-3">
              {recentSearches.map(record => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b border-premier-gold/10 last:border-0">
                  <div>
                    <p className="text-premier-pearl text-sm font-medium">{record.keyword}</p>
                    <p className="text-premier-pearl-gray text-xs mt-0.5">
                      {record.resultCount} {t('services.results')} · {new Date(record.searchedAt).toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/${locale}/case-search?q=${encodeURIComponent(record.keyword)}`} className="text-premier-gold hover:text-premier-gold-champagne">
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
            {t('services.databaseUpdates')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-premier-gold/10">
              <span className="text-premier-pearl-gray text-sm">{t('services.todayNewCases')}</span>
              <span className="text-premier-gold font-bold">{loading ? '-' : stats.todayNew}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-premier-gold/10">
              <span className="text-premier-pearl-gray text-sm">{t('services.totalCases')}</span>
              <span className="text-premier-gold font-bold">{loading ? '-' : stats.totalCases.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-premier-gold/10">
              <span className="text-premier-pearl-gray text-sm">{t('services.lastCrawl')}</span>
              <span className="text-premier-pearl-gray text-sm">
                {stats.crawlerLastRun ? new Date(stats.crawlerLastRun).toLocaleString() : t('services.notAvailable')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-premier-pearl-gray text-sm">{t('services.systemStatus')}</span>
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
          {t('services.quickLinks')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Database className="w-5 h-5" />, label: t('services.caseDatabase'), href: `/${locale}/case-search` },
            { icon: <FileText className="w-5 h-5" />, label: t('services.formsRepository'), href: `/${locale}/case-search?filter=forms` },
            { icon: <TrendingUp className="w-5 h-5" />, label: t('services.aiSmartSearch'), href: `/${locale}/case-search?mode=ai` },
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
