'use client'

import { usePathname } from 'next/navigation'
import { CheckCircle2, XCircle, AlertTriangle, Clock, Database, RefreshCw, Settings, Rss } from 'lucide-react'

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

interface AdminDashboardClientProps {
  rssSources: RssSourceRow[]
  totalPublicCases: number
  todayPublicCases: number
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-800">
        <CheckCircle2 className="w-3 h-3" /> Active
      </span>
    )
  }
  if (status === 'ERROR') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-400 border border-red-800">
        <XCircle className="w-3 h-3" /> Error
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-400 border border-yellow-800">
      <AlertTriangle className="w-3 h-3" /> Inactive
    </span>
  )
}

export function AdminDashboardClient({ rssSources, totalPublicCases, todayPublicCases }: AdminDashboardClientProps) {
  const pathname = usePathname() || '/'
  const isEn = pathname.startsWith('/en')

  const activeSources = rssSources.filter(s => s.status === 'ACTIVE').length
  const errorSources = rssSources.filter(s => s.status === 'ERROR').length
  const successRate = rssSources.length > 0
    ? Math.round((activeSources / rssSources.length) * 100)
    : 0

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-premier-gold">
          {isEn ? 'Admin Dashboard' : '管理員面板'}
        </h1>
        <p className="text-premier-pearl-gray text-sm mt-1">
          {isEn ? 'Crawler monitoring, source management and system settings' : '爬蟲監控、來源管理及系統設置'}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Database className="w-5 h-5" />, label: isEn ? 'Total Cases' : '總法案數', value: totalPublicCases.toLocaleString() },
          { icon: <RefreshCw className="w-5 h-5" />, label: isEn ? "Today's New" : '今日新增', value: todayPublicCases },
          { icon: <Rss className="w-5 h-5" />, label: isEn ? 'Active Sources' : '活躍來源', value: `${activeSources}/${rssSources.length}` },
          { icon: <CheckCircle2 className="w-5 h-5" />, label: isEn ? 'Success Rate' : '成功率', value: `${successRate}%` },
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

      {/* RSS Source Management */}
      <div className="glass-card rounded-premier-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-premier-gold flex items-center gap-2">
            <Rss className="w-5 h-5" />
            {isEn ? 'RSS Source Management' : '新聞源管理'}
          </h2>
        </div>

        {rssSources.length === 0 ? (
          <p className="text-premier-pearl-gray text-sm">
            {isEn ? 'No RSS sources configured.' : '尚無 RSS 來源配置。'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-premier-gold/20">
                  <th className="text-left py-3 pr-4 text-premier-pearl-gray font-medium">{isEn ? 'Name' : '名稱'}</th>
                  <th className="text-left py-3 pr-4 text-premier-pearl-gray font-medium">{isEn ? 'Status' : '狀態'}</th>
                  <th className="text-left py-3 pr-4 text-premier-pearl-gray font-medium">{isEn ? 'Last Fetch' : '最後爬取'}</th>
                  <th className="text-left py-3 text-premier-pearl-gray font-medium">{isEn ? 'Last Error' : '錯誤日誌'}</th>
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
                          : (isEn ? 'Never' : '從未')}
                      </span>
                    </td>
                    <td className="py-3">
                      {source.lastError ? (
                        <span className="text-red-400 text-xs truncate max-w-xs block">{source.lastError}</span>
                      ) : (
                        <span className="text-premier-pearl-gray text-xs">{isEn ? 'None' : '無'}</span>
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
            <span className="text-premier-pearl-gray text-sm">{isEn ? 'Overall Success Rate' : '整體成功率'}</span>
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
              {isEn ? `${errorSources} source(s) in error state` : `${errorSources} 個來源處於錯誤狀態`}
            </p>
          )}
        </div>
      </div>

      {/* System Settings Placeholder */}
      <div className="glass-card rounded-premier-lg p-6">
        <h2 className="text-lg font-semibold text-premier-gold flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5" />
          {isEn ? 'System Settings' : '系統設置'}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-premier-pearl-gray text-sm mb-2">
              {isEn ? 'Crawler Global Switch' : '爬蟲全局開關'}
            </label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-5 bg-green-700 rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
              </div>
              <span className="text-green-400 text-sm">{isEn ? 'Enabled' : '已啟用'}</span>
            </div>
          </div>
          <div>
            <label className="block text-premier-pearl-gray text-sm mb-2">
              {isEn ? 'Success Rate Threshold' : '成功率閾值'}
            </label>
            <div className="flex items-center gap-2">
              <div className="bg-premier-black-light border border-premier-gold/20 rounded-premier-md px-3 py-2 text-premier-pearl text-sm w-24">
                60%
              </div>
              <span className="text-premier-pearl-gray text-xs">
                {isEn ? '(Auto-alert below this threshold)' : '（低於此值時自動告警）'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-premier-pearl-gray text-xs mt-4">
          {isEn
            ? 'Full settings management coming soon.'
            : '完整設置管理即將推出。'}
        </p>
      </div>
    </div>
  )
}
