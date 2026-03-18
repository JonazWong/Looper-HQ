'use client'

import { useEffect, useState } from 'react'

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3005' : null)

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: '民事 Civil',
  CRIMINAL: '刑事 Criminal',
  CRIMINAL_APPEAL: '刑事上訴 Criminal Appeal',
  CONSTITUTIONAL: '憲制 Constitutional',
  CORPORATE: '公司 Corporate',
  FAMILY: '家事 Family',
  PROPERTY: '物業 Property',
  EMPLOYMENT: '勞工 Employment',
  INTELLECTUAL_PROPERTY: '知識產權 IP',
  IMMIGRATION: '移民 Immigration',
  PERSONAL_INJURY: '人身傷亡 Personal Injury',
  PROBATE: '遺產 Probate',
  OTHER: '其他 Other',
}

const COURT_LEVEL_LABELS: Record<string, string> = {
  COURT_OF_FINAL_APPEAL: '終審法院 CFA',
  COURT_OF_APPEAL: '上訴法庭 CA',
  COURT_OF_FIRST_INSTANCE: '原訟法庭 CFI',
  DISTRICT_COURT: '區域法院 DC',
  FAMILY_COURT: '家事法庭 FC',
  MAGISTRATES_COURT: '裁判法院 MC',
  LABOUR_TRIBUNAL: '勞資審裁處 LabT',
  LANDS_TRIBUNAL: '土地審裁處 LandT',
  COMPETITION_TRIBUNAL: '競爭審裁處 CT',
  SMALL_CLAIMS_TRIBUNAL: '小額錢債 SCT',
  OTHER: '其他',
}

interface SearchResult {
  id: string
  title_zh: string
  title_en: string
  caseNumber: string | null
  source: string
  category: string | null
  court: string | null
  courtLevel: string | null
  publishedAt: string | null
  crawledAt: string
}

const selectStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: 8,
  border: '1px solid #D4AF37',
  background: '#1a1a1a',
  color: '#f5f5f5',
  fontSize: '0.875rem',
  cursor: 'pointer',
}

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [courtLevel, setCourtLevel] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' && !WEB_APP_URL) {
      // Warn in non-development environments when the dashboard URL is missing
      // so that configuration issues don't go unnoticed.
      console.error(
        'Configuration warning: NEXT_PUBLIC_WEB_APP_URL is not set in a non-development environment. ' +
        'The dashboard link will be omitted. Update your environment to include NEXT_PUBLIC_WEB_APP_URL ' +
        'or update the documentation to reflect that it is optional.'
      )
    }
  }, [])

  const buildSearchUrl = () => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('query', query.trim())
    if (category) params.set('category', category)
    if (courtLevel) params.set('courtLevel', courtLevel)
    params.set('limit', '20')
    return `/api/search?${params.toString()}`
  }

  const search = async () => {
    if (!query.trim() && !category && !courtLevel) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(buildSearchUrl())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResults(data.data?.cases || data.data || [])
      setTotal(data.meta?.total ?? data.data?.pagination?.total ?? null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#D4AF37', marginBottom: '0.5rem' }}>
          Looper HQ — 香港法律案件搜尋
        </h1>
        <p style={{ color: '#C0C0C0', fontSize: '0.95rem' }}>
          Hong Kong Legal Case Search Portal
        </p>
      </header>

      {/* Search Box */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="搜尋法律案件、案號、關鍵詞… / Search cases, case numbers, keywords…"
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 8,
            border: '1px solid #D4AF37',
            background: '#1a1a1a',
            color: '#f5f5f5',
            fontSize: '1rem',
          }}
        />
        <button
          onClick={search}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #D4AF37, #B8860B)',
            color: '#0a0a0a',
            border: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '搜尋中…' : '搜尋'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={selectStyle}
          aria-label="Filter by category"
        >
          <option value="">全部類別 / All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={courtLevel}
          onChange={(e) => setCourtLevel(e.target.value)}
          style={selectStyle}
          aria-label="Filter by court level"
        >
          <option value="">全部法院級別 / All Court Levels</option>
          {Object.entries(COURT_LEVEL_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        {(category || courtLevel) && (
          <button
            onClick={() => { setCategory(''); setCourtLevel('') }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid #C0C0C0',
              background: 'transparent',
              color: '#C0C0C0',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            清除篩選 / Clear Filters
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>錯誤: {error}</p>
      )}

      {/* Results count */}
      {total !== null && !loading && (
        <p style={{ color: '#C0C0C0', marginBottom: '1rem', fontSize: '0.9rem' }}>
          找到 {total} 個結果 / Found {total} results
        </p>
      )}

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {results.map((r) => (
          <div
            key={r.id}
            style={{
              background: '#1a1a1a',
              border: '1px solid #D4AF37',
              borderRadius: 8,
              padding: '1rem 1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <h3 style={{ color: '#D4AF37', margin: 0, fontSize: '1rem', flex: 1 }}>
                {r.title_zh || r.title_en}
              </h3>
              {r.category && CATEGORY_LABELS[r.category] && (
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: 4,
                  background: '#2a1f00',
                  border: '1px solid #D4AF37',
                  color: '#D4AF37',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                }}>
                  {CATEGORY_LABELS[r.category]}
                </span>
              )}
            </div>
            {r.title_zh && r.title_en && r.title_zh !== r.title_en && (
              <p style={{ color: '#C0C0C0', margin: 0, marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                {r.title_en}
              </p>
            )}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {r.caseNumber && (
                <span style={{ color: '#C0C0C0', fontSize: '0.8rem' }}>案號: {r.caseNumber}</span>
              )}
              {r.courtLevel && COURT_LEVEL_LABELS[r.courtLevel] && (
                <span style={{ color: '#C0C0C0', fontSize: '0.8rem' }}>
                  級別: {COURT_LEVEL_LABELS[r.courtLevel]}
                </span>
              )}
              {r.court && (
                <span style={{ color: '#C0C0C0', fontSize: '0.8rem' }}>法院: {r.court}</span>
              )}
              <span style={{ color: '#C0C0C0', fontSize: '0.8rem' }}>
                來源: {r.source}
              </span>
              {r.publishedAt && (
                <span style={{ color: '#C0C0C0', fontSize: '0.8rem' }}>
                  {new Date(r.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && total === null && (
        <p style={{ color: '#C0C0C0', textAlign: 'center', marginTop: '3rem' }}>
          輸入關鍵詞或選擇類別開始搜尋 / Enter a keyword or select a filter to search
        </p>
      )}

      {/* Footer */}
      <footer style={{ marginTop: '3rem', textAlign: 'center', color: '#C0C0C0', fontSize: '0.8rem' }}>
        <p>Looper HQ Legal Case Search Portal — Port 3001</p>
        {WEB_APP_URL && (
          <p>
            <a href={`${WEB_APP_URL}/zh/dashboard`} style={{ color: '#D4AF37' }}>
              前往完整管理系統 →
            </a>
          </p>
        )}
      </footer>
    </main>
  )
}
