'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AutoLinkText } from '@/lib/case-linking/use-case-linking'
import type { CitationEdge } from '@/lib/services/citation-service'

interface Props {
  params: Promise<{ locale: string; id: string }>
}

interface CaseData {
  id: string
  title_zh: string
  title_en: string
  caseNumber: string | null
  neutralCitation: string | null
  court: string | null
  judgment_zh: string | null
  judgment_en: string | null
  fullText: string | null
}

export default function FullTextPage({ params }: Props) {
  const [resolvedParams, setResolvedParams] = useState<{ locale: string; id: string } | null>(null)
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [outgoing, setOutgoing] = useState<CitationEdge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (!resolvedParams) return
    const { id } = resolvedParams

    Promise.all([
      fetch(`/api/public-cases/${id}`).then((r) => r.json()),
      fetch(`/api/public-cases/${id}/citations?type=outgoing&limit=50`).then((r) => r.json()),
    ]).then(([caseRes, citRes]) => {
      if (caseRes.success) setCaseData(caseRes.data)
      if (citRes.success) setOutgoing(citRes.data.outgoing)
      setLoading(false)
    })
  }, [resolvedParams])

  if (!resolvedParams || loading) {
    return (
      <div className="min-h-screen bg-premier-black flex items-center justify-center">
        <div className="text-premier-gold animate-pulse text-lg">載入中…</div>
      </div>
    )
  }

  const { locale, id } = resolvedParams

  if (!caseData) {
    return (
      <div className="min-h-screen bg-premier-black flex items-center justify-center">
        <div className="text-red-400 text-lg">找不到案例</div>
      </div>
    )
  }

  const zhContent = caseData.judgment_zh || caseData.fullText
  const enContent = caseData.judgment_en || caseData.fullText
  const content = lang === 'zh' ? zhContent : enContent
  const title = lang === 'zh' ? caseData.title_zh : caseData.title_en

  return (
    <div className="min-h-screen bg-premier-black text-white">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href={`/${locale}/public-cases/${id}`}
          className="text-sm text-zinc-400 hover:text-premier-gold transition-colors flex items-center gap-1"
        >
          ← 返回案例詳情
        </Link>

        {/* Language toggle */}
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button
            onClick={() => setLang('zh')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              lang === 'zh' ? 'bg-premier-gold text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            中文
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              lang === 'en' ? 'bg-premier-gold text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Main content */}
        <main className="flex-1 p-6 lg:p-10 min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
              {caseData.caseNumber && <span>{caseData.caseNumber}</span>}
              {caseData.neutralCitation && (
                <span className="text-premier-gold">{caseData.neutralCitation}</span>
              )}
              {caseData.court && <span>{caseData.court}</span>}
            </div>
          </div>

          {content ? (
            <article className="prose prose-invert prose-sm max-w-none leading-relaxed text-zinc-300">
              <AutoLinkText text={content} />
            </article>
          ) : (
            <div className="text-zinc-500 text-center py-20">
              <p className="text-5xl mb-4">📄</p>
              <p>此語言暫無全文內容</p>
            </div>
          )}
        </main>

        {/* Citation sidebar */}
        {outgoing.length > 0 && (
          <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 border-l border-zinc-800 p-6 overflow-y-auto max-h-screen sticky top-14">
            <h2 className="text-sm font-semibold text-premier-gold uppercase tracking-wider mb-4">
              引用案例 ({outgoing.length})
            </h2>
            <div className="space-y-3">
              {outgoing.map((edge) => (
                <div
                  key={edge.id}
                  className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-premier-gold/30 transition-colors"
                >
                  {edge.relatedCase ? (
                    <Link
                      href={`/${locale}/public-cases/${edge.relatedCase.id}`}
                      className="block"
                    >
                      <p className="text-xs font-medium text-zinc-200 line-clamp-2">
                        {edge.relatedCase.title_zh || edge.relatedCase.title_en}
                      </p>
                      {edge.relatedCase.caseNumber && (
                        <p className="text-xs text-zinc-500 mt-1">{edge.relatedCase.caseNumber}</p>
                      )}
                    </Link>
                  ) : (
                    <p className="text-xs text-zinc-400">{edge.externalRef || edge.citationText}</p>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
