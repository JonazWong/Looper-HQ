'use client'

import { useState } from 'react'

interface SearchResult {
  id: string
  title_zh: string
  title_en: string
  caseNumber: string | null
  source: string
  court: string | null
  publishedAt: string | null
  crawledAt: string
}


export default function HomePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(query)}&limit=20`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResults(data.data?.cases || data.data || [])
      setTotal(data.meta?.total ?? null)
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
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
            <h3 style={{ color: '#D4AF37', margin: 0, marginBottom: '0.25rem', fontSize: '1rem' }}>
              {r.title_zh || r.title_en}
            </h3>
            {r.title_zh && r.title_en && r.title_zh !== r.title_en && (
              <p style={{ color: '#C0C0C0', margin: 0, marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                {r.title_en}
              </p>
            )}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {r.caseNumber && (
                <span style={{ color: '#C0C0C0', fontSize: '0.8rem' }}>案號: {r.caseNumber}</span>
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
          輸入關鍵詞開始搜尋 / Enter a keyword to search
        </p>
      )}

      {/* Footer */}
      <footer style={{ marginTop: '3rem', textAlign: 'center', color: '#C0C0C0', fontSize: '0.8rem' }}>
        <p>Looper HQ Legal Case Search Portal — Port 3001</p>
        <p>
          <a href={`${WEB_APP_URL}/zh/dashboard`} style={{ color: '#D4AF37' }}>
            前往完整管理系統 →
          </a>
        </p>
      </footer>
    </main>
  )
}
