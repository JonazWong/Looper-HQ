/**
 * HK Legal Case Search - Main Page
 * 香港法律案件搜尋 - 主頁面
 *
 * Public portal for searching Hong Kong legal cases, judgments, and legal news.
 * No authentication required.
 */

import { Suspense } from 'react'

const DEFAULT_WEB_APP_URL = 'http://localhost:3005'

const styles = {
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 40,
    width: '100%',
    borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
    backdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    padding: '0 1rem',
  },
  headerInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    height: '64px',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: '1.25rem',
  },
  container: {
    maxWidth: '1024px',
    margin: '0 auto',
    padding: '3rem 1rem',
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: '3rem',
  },
  searchForm: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '2rem',
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '8px',
    color: '#F5F5F5',
    fontSize: '1rem',
    outline: 'none',
  },
  searchButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(to right, #D4AF37, #B8860B)',
    border: 'none',
    borderRadius: '8px',
    color: '#0a0a0a',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  caseCard: {
    padding: '1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(212, 175, 55, 0.15)',
    borderRadius: '12px',
    marginBottom: '1rem',
  },
  caseTitle: {
    color: '#D4AF37',
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    margin: '0 0 0.5rem 0',
  },
  caseMeta: {
    color: '#C0C0C0',
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
    margin: '0 0 0.75rem 0',
  },
  caseDescription: {
    color: '#F5F5F5',
    fontSize: '0.875rem',
    lineHeight: 1.6,
    margin: 0,
  },
  footer: {
    marginTop: '3rem',
    paddingTop: '2rem',
    borderTop: '1px solid rgba(212, 175, 55, 0.1)',
    textAlign: 'center' as const,
    color: '#C0C0C0',
    fontSize: '0.875rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '9999px',
    color: '#D4AF37',
    fontSize: '0.75rem',
    marginRight: '0.5rem',
  },
}

function LoadingSpinner() {
  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <div
          style={{
            display: 'inline-block',
            width: '48px',
            height: '48px',
            border: '3px solid rgba(212, 175, 55, 0.2)',
            borderTopColor: '#D4AF37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ marginTop: '1rem', color: '#C0C0C0' }}>載入中...</p>
      </div>
    </>
  )
}

function PlaceholderCases() {
  const placeholderCases = [
    {
      id: 1,
      title_zh: '香港特別行政區 訴 被告人 (2024)',
      title_en: 'HKSAR v Defendant (2024)',
      source: 'HK Judiciary',
      date: '2024-01-15',
      description_zh: '本案涉及香港刑事法律相關事宜。如需查閱完整案件資料，請登入 Looper HQ 系統。',
    },
    {
      id: 2,
      title_zh: '申請人 訴 答辯人 - 家事法庭案件',
      title_en: 'Applicant v Respondent - Family Court',
      source: 'HK Judiciary',
      date: '2024-01-10',
      description_zh: '本案為家事法庭案件。如需查閱完整案件資料，請登入 Looper HQ 系統。',
    },
    {
      id: 3,
      title_zh: '法律新聞：香港法律改革最新動態',
      title_en: 'Legal News: Latest Hong Kong Law Reform Updates',
      source: 'RTHK',
      date: '2024-01-08',
      description_zh: '香港法律改革委員會發布最新報告，涵蓋多項法律修訂建議。',
    },
  ]

  return (
    <div>
      {placeholderCases.map((c) => (
        <div key={c.id} style={styles.caseCard}>
          <h3 style={styles.caseTitle}>{c.title_zh}</h3>
          <p style={styles.caseMeta}>
            <span style={styles.badge}>{c.source}</span>
            {c.date}
          </p>
          <p style={styles.caseDescription}>{c.description_zh}</p>
        </div>
      ))}
    </div>
  )
}

export default function LegalCaseSearchPage() {
  const resolvedWebAppUrl =
    process.env.NEXT_PUBLIC_WEB_APP_URL ??
    (process.env.NODE_ENV === 'development' ? DEFAULT_WEB_APP_URL : undefined)

  if (!resolvedWebAppUrl) {
    throw new Error(
      'NEXT_PUBLIC_WEB_APP_URL must be set in production for the Legal Case Search app.'
    )
  }

  return (
    <div>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>⚖️ Looper HQ - 法律案件搜尋</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a
              href={`${resolvedWebAppUrl}/zh/login`}
              style={{ color: '#C0C0C0', textDecoration: 'none', padding: '0.5rem 1rem' }}
            >
              登入
            </a>
            <a
              href={`${resolvedWebAppUrl}/zh/register`}
              style={{
                background: 'linear-gradient(to right, #D4AF37, #B8860B)',
                color: '#0a0a0a',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '600',
              }}
            >
              立即註冊
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.container}>
        {/* Page Title */}
        <div style={styles.title}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #D4AF37, #F7E7CE, #D4AF37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
            }}
          >
            香港法律案件搜尋
          </h1>
          <p style={{ color: '#C0C0C0', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
            搜尋每日更新的香港法律案件、判決書及法律新聞
          </p>
          <p style={{ color: '#888', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            資料來源：香港司法機構、本地新聞媒體
          </p>
        </div>

        {/* Search Form */}
        <form style={styles.searchForm} action="/" method="get">
          <input
            type="search"
            name="q"
            placeholder="輸入案件名稱、關鍵字或當事人姓名..."
            aria-label="搜尋案件、關鍵字或當事人姓名"
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>
            搜尋
          </button>
        </form>

        {/* Case Results */}
        <Suspense fallback={<LoadingSpinner />}>
          <PlaceholderCases />
        </Suspense>

        {/* Footer */}
        <footer style={styles.footer}>
          <p>
            資料每日自動更新 | 如需專業法律案件管理服務，請{' '}
            <a href={`${webAppUrl}/zh/dashboard`} style={{ color: '#D4AF37' }}>
              登入 Looper HQ 管理系統
            </a>
          </p>
          <p style={{ marginTop: '0.5rem', color: '#888' }}>
            © {new Date().getFullYear()} Looper HQ. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  )
}
