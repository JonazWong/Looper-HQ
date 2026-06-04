'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CheckCircle2, XCircle, AlertTriangle, Clock, Database, RefreshCw, Settings, Rss, Activity, Calendar, Brain } from 'lucide-react'

interface RssSourceRow {
  id: string
  name: string
  url: string
  source: string
  isActive: boolean
  status: string
  lastFetchAt: string | null
  lastError: string | null
}

interface JobRunRow {
  id: string
  status: string
  totalAdded: number
  totalErrors: number
  durationSeconds: number | null
  startedAt: string
  completedAt: string | null
  triggeredBy: string
}

interface AdminDashboardClientProps {
  rssSources: RssSourceRow[]
  totalPublicCases: number
  todayPublicCases: number
  latestJobRun: JobRunRow | null
  recentJobRuns: JobRunRow[]
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations()

  if (status === 'ACTIVE' || status === 'SUCCESS') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-800">
        <CheckCircle2 className="w-3 h-3" /> {status === 'SUCCESS' ? t('admin.status.success') : t('admin.status.active')}
      </span>
    )
  }
  if (status === 'ERROR' || status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-400 border border-red-800">
        <XCircle className="w-3 h-3" /> {status === 'FAILED' ? t('admin.status.failed') : t('admin.status.error')}
      </span>
    )
  }
  if (status === 'PARTIAL_SUCCESS') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-400 border border-yellow-800">
        <AlertTriangle className="w-3 h-3" /> {t('admin.status.partialSuccess')}
      </span>
    )
  }
  if (status === 'RUNNING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-800">
        <RefreshCw className="w-3 h-3 animate-spin" /> {t('admin.status.running')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-400 border border-yellow-800">
      <AlertTriangle className="w-3 h-3" /> {t('admin.status.inactive')}
    </span>
  )
}

export function AdminDashboardClient({ rssSources, totalPublicCases, todayPublicCases, latestJobRun, recentJobRuns }: AdminDashboardClientProps) {
  const t = useTranslations()

  const activeSources = rssSources.filter(s => s.status === 'ACTIVE').length
  const errorSources = rssSources.filter(s => s.status === 'ERROR').length
  const successRate = rssSources.length > 0
    ? Math.round((activeSources / rssSources.length) * 100)
    : 0

  const lastCrawlTime = latestJobRun?.completedAt
    ? new Date(latestJobRun.completedAt).toLocaleString()
    : latestJobRun?.startedAt
      ? new Date(latestJobRun.startedAt).toLocaleString()
      : t('common.never')

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-premier-gold">
          {t('admin.dashboard.title')}
        </h1>
        <p className="text-premier-pearl-gray text-sm mt-1">
          {t('admin.dashboard.subtitle')}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Database className="w-5 h-5" />, label: t('admin.dashboard.overview.totalCases'), value: totalPublicCases.toLocaleString() },
          { icon: <RefreshCw className="w-5 h-5" />, label: t('admin.dashboard.overview.todaysNew'), value: todayPublicCases },
          { icon: <Rss className="w-5 h-5" />, label: t('admin.dashboard.overview.activeSources'), value: `${activeSources}/${rssSources.length}` },
          { icon: <CheckCircle2 className="w-5 h-5" />, label: t('admin.dashboard.overview.successRate'), value: `${successRate}%` },
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

      {/* Crawler Job Run History */}
      <div className="glass-card rounded-premier-lg p-6">
        <h2 className="text-lg font-semibold text-premier-gold flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5" />
          {t('admin.dashboard.crawlerJobHistory.title')}
        </h2>
        {/* Latest Run Summary */}
        {latestJobRun ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-premier-black-light rounded-premier-md">
            <div>
              <p className="text-premier-pearl-gray text-xs mb-1">{t('admin.dashboard.crawlerJobHistory.lastRunStatus')}</p>
              <StatusBadge status={latestJobRun.status} />
            </div>
            <div>
              <p className="text-premier-pearl-gray text-xs mb-1">{t('admin.dashboard.crawlerJobHistory.lastRunTime')}</p>
              <p className="text-premier-pearl text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3 text-premier-gold" />
                {lastCrawlTime}
              </p>
            </div>
            <div>
              <p className="text-premier-pearl-gray text-xs mb-1">{t('admin.dashboard.crawlerJobHistory.itemsAdded')}</p>
              <p className="text-premier-pearl text-sm font-semibold">{latestJobRun.totalAdded}</p>
            </div>
            <div>
              <p className="text-premier-pearl-gray text-xs mb-1">{t('admin.dashboard.crawlerJobHistory.duration')}</p>
              <p className="text-premier-pearl text-sm">
                {latestJobRun.durationSeconds != null ? `${latestJobRun.durationSeconds}s` : t('common.na')}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-premier-pearl-gray text-sm mb-4">
            {t('admin.dashboard.crawlerJobHistory.noRuns')}
          </p>
        )}

        {/* Recent Runs Table */}
        {recentJobRuns.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-premier-gold/20">
                  <th className="text-left py-3 pr-4 text-premier-pearl-gray font-medium">{t('admin.dashboard.recentRuns.status')}</th>
                  <th className="text-left py-3 pr-4 text-premier-pearl-gray font-medium">{t('admin.dashboard.recentRuns.startedAt')}</th>
                  <th className="text-left py-3 pr-4 text-premier-pearl-gray font-medium">{t('admin.dashboard.recentRuns.added')}</th>
                  <th className="text-left py-3 pr-4 text-premier-pearl-gray font-medium">{t('admin.dashboard.recentRuns.errors')}</th>
                  <th className="text-left py-3 text-premier-pearl-gray font-medium">{t('admin.dashboard.recentRuns.triggeredBy')}</th>
                </tr>
              </thead>
              <tbody>
                {recentJobRuns.map(run => (
                  <tr key={run.id} className="border-b border-premier-gold/10 hover:bg-premier-gold/5 transition-colors">
                    <td className="py-3 pr-4">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-premier-pearl-gray flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(run.startedAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-premier-pearl font-medium">{run.totalAdded}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={run.totalErrors > 0 ? 'text-red-400' : 'text-premier-pearl-gray'}>
                        {run.totalErrors}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-premier-pearl-gray text-xs">{run.triggeredBy}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RSS Source Management */}
      <div className="glass-card rounded-premier-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-premier-gold flex items-center gap-2">
            <Rss className="w-5 h-5" />
            {t('admin.dashboard.rss.title')}
          </h2>
        </div>

        {rssSources.length === 0 ? (
          <p className="text-premier-pearl-gray text-sm">
            {t('admin.dashboard.rss.noSources')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-premier-gold/20">
                  <th className="text-left py-3 pr-4 text-premier-pearl-gray font-medium">{t('admin.dashboard.rss.name')}</th>
                  <th className="text-left py-3 pr-4 text-premier-pearl-gray font-medium">{t('admin.dashboard.rss.status')}</th>
                  <th className="text-left py-3 pr-4 text-premier-pearl-gray font-medium">{t('admin.dashboard.rss.lastFetch')}</th>
                  <th className="text-left py-3 text-premier-pearl-gray font-medium">{t('admin.dashboard.rss.lastError')}</th>
                </tr>
              </thead>
              <tbody>
                {rssSources.map(source => (
                  <tr key={source.id} className="border-b border-premier-gold/10 hover:bg-premier-gold/5 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="text-premier-pearl font-medium">{source.name}</div>
                      <div className="text-premier-pearl-gray text-xs mt-0.5 truncate max-w-xs">{source.url}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={source.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-premier-pearl-gray flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {source.lastFetchAt
                          ? new Date(source.lastFetchAt).toLocaleString()
                          : t('common.never')}
                      </span>
                    </td>
                    <td className="py-3">
                      {source.lastError ? (
                        <span className="text-red-400 text-xs truncate max-w-xs block">{source.lastError}</span>
                      ) : (
                        <span className="text-premier-pearl-gray text-xs">{t('common.none')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Success Rate Progress */}
        <div className="mt-6 pt-4 border-t border-premier-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-premier-pearl-gray text-sm">{t('admin.dashboard.overallSuccessRate')}</span>
            <span className="text-premier-gold text-sm font-semibold">{successRate}%</span>
          </div>
          <div className="w-full bg-premier-black-light rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-premier-gold to-premier-gold-rose transition-all"
              style={{ width: `${successRate}%` }}
            />
          </div>
          {errorSources > 0 && (
            <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {t('admin.dashboard.errorSources', { count: errorSources })}
            </p>
          )}
        </div>
      </div>

      {/* System Settings Placeholder */}
      <div className="glass-card rounded-premier-lg p-6">
        <h2 className="text-lg font-semibold text-premier-gold flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5" />
          {t('admin.dashboard.systemSettings.title')}
        </h2>
        {/* AI Tools Section */}
        <div className="mb-6">
          <h3 className="text-premier-pearl text-sm font-medium mb-3">
            {t('dashboard.aiTools.title')}
          </h3>
          <Link
            href="./ai-classify"
            className="flex items-center gap-3 p-4 bg-premier-gold/10 border border-premier-gold/30 rounded-premier-md hover:bg-premier-gold/20 transition-colors group"
          >
            <div className="p-2 bg-premier-gold/20 rounded-lg group-hover:bg-premier-gold/30 transition-colors">
              <Brain className="w-5 h-5 text-premier-gold" />
            </div>
            <div className="flex-1">
              <div className="text-premier-pearl font-medium text-sm">
                {t('dashboard.aiTools.batchClassification')}
              </div>
              <div className="text-premier-pearl-gray text-xs mt-0.5">
                {t('dashboard.aiTools.batchClassificationDescription')}
              </div>
            </div>
            <div className="text-premier-gold text-xs">→</div>
          </Link>
        </div>

        {/* Configuration Section */}
        <div>
          <h3 className="text-premier-pearl text-sm font-medium mb-3">
            {t('admin.dashboard.systemSettings.configuration.title')}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-premier-pearl-gray text-sm mb-2">
                {t('admin.dashboard.systemSettings.configuration.crawlerGlobalSwitch')}
              </label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-5 bg-green-700 rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                </div>
                <span className="text-green-400 text-sm">{t('admin.dashboard.systemSettings.configuration.enabled')}</span>
              </div>
            </div>
            <div>
              <label className="block text-premier-pearl-gray text-sm mb-2">
                {t('admin.dashboard.systemSettings.configuration.successRateThreshold')}
              </label>
              <div className="flex items-center gap-2">
                <div className="bg-premier-black-light border border-premier-gold/20 rounded-premier-md px-3 py-2 text-premier-pearl text-sm w-24">
                  60%
                </div>
                <span className="text-premier-pearl-gray text-xs">
                  {t('admin.dashboard.systemSettings.configuration.autoAlertBelowThreshold')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

