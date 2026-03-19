import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getCitationCounts } from '@/lib/services/citation-service'
import { getRelatedCases } from '@/lib/services/recommendations'
import { AutoLinkText } from '@/lib/case-linking/use-case-linking'

interface Props {
  params: Promise<{ locale: string; id: string }>
}

export default async function PublicCaseDetailPage({ params }: Props) {
  const { locale, id } = await params

  const [publicCase, citationCounts] = await Promise.all([
    prisma.publicCase.findUnique({
      where: { id },
    }),
    getCitationCounts(id),
  ])

  if (!publicCase) notFound()

  const relatedCases = await getRelatedCases(id, 5)

  const title = publicCase.title_zh || publicCase.title_en
  const description = publicCase.description_zh || publicCase.description_en

  return (
    <div className="min-h-screen bg-premier-black text-white p-6 lg:p-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-500 flex items-center gap-2">
        <Link href={`/${locale}/public-cases`} className="hover:text-premier-gold transition-colors">
          公開案例
        </Link>
        <span>/</span>
        <span className="text-zinc-300 truncate max-w-xs">{publicCase.caseNumber || id}</span>
      </nav>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="glass-card rounded-premier-lg p-6 border border-zinc-800 bg-zinc-900/50">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              {publicCase.category && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-premier-gold/10 text-premier-gold border border-premier-gold/30">
                  {publicCase.category}
                </span>
              )}
              {publicCase.source && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {publicCase.source}
                </span>
              )}
            </div>
            <Link
              href={`/${locale}/public-cases/${id}/full`}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-premier-gold/20 text-premier-gold border border-premier-gold/40 hover:bg-premier-gold/30 transition-colors"
            >
              閱讀全文 →
            </Link>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{title}</h1>
          {publicCase.title_en && publicCase.title_zh && (
            <p className="text-lg text-zinc-400 mb-4">{publicCase.title_en}</p>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {publicCase.caseNumber && (
              <MetaItem label="案件編號" value={publicCase.caseNumber} />
            )}
            {publicCase.neutralCitation && (
              <MetaItem label="中性引用" value={publicCase.neutralCitation} highlight />
            )}
            {publicCase.court && (
              <MetaItem
                label="法院"
                value={
                  <Link
                    href={`/${locale}/courts/${encodeURIComponent(publicCase.court)}`}
                    className="text-premier-gold hover:underline"
                  >
                    {publicCase.court}
                  </Link>
                }
              />
            )}
            {publicCase.judge && (
              <MetaItem
                label="法官"
                value={
                  <Link
                    href={`/${locale}/judges/${encodeURIComponent(publicCase.judge)}`}
                    className="text-premier-gold hover:underline"
                  >
                    {publicCase.judge}
                  </Link>
                }
              />
            )}
            {publicCase.judgmentDate && (
              <MetaItem
                label="判決日期"
                value={new Date(publicCase.judgmentDate).toLocaleDateString('zh-HK')}
              />
            )}
            <MetaItem label="爬取日期" value={new Date(publicCase.crawledAt).toLocaleDateString('zh-HK')} />
          </div>
        </div>

        {/* Citation counts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-premier-lg p-4 border border-zinc-800 bg-zinc-900/50 text-center">
            <p className="text-3xl font-bold text-premier-gold">{citationCounts.outgoing}</p>
            <p className="text-sm text-zinc-400 mt-1">引用其他案例</p>
          </div>
          <div className="glass-card rounded-premier-lg p-4 border border-zinc-800 bg-zinc-900/50 text-center">
            <p className="text-3xl font-bold text-premier-gold">{citationCounts.incoming}</p>
            <p className="text-sm text-zinc-400 mt-1">被其他案例引用</p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="glass-card rounded-premier-lg p-6 border border-zinc-800 bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-premier-gold mb-3">案例摘要</h2>
            <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
              <AutoLinkText text={description} />
            </div>
          </div>
        )}

        {/* Keywords */}
        {publicCase.keywords && publicCase.keywords.length > 0 && (
          <div className="glass-card rounded-premier-lg p-6 border border-zinc-800 bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-premier-gold mb-3">關鍵詞</h2>
            <div className="flex flex-wrap gap-2">
              {publicCase.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-sm bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source link */}
        {publicCase.sourceUrl && (
          <div className="glass-card rounded-premier-lg p-4 border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <span className="text-zinc-400 text-sm">原始文件</span>
            <a
              href={publicCase.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-premier-gold text-sm hover:underline flex items-center gap-1"
            >
              在原始來源查看 ↗
            </a>
          </div>
        )}

        {/* Related cases */}
        {relatedCases.length > 0 && (
          <div className="glass-card rounded-premier-lg p-6 border border-zinc-800 bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-premier-gold mb-4">相關案例</h2>
            <div className="space-y-3">
              {relatedCases.map((related) => (
                <Link
                  key={related.id}
                  href={`/${locale}/public-cases/${related.id}`}
                  className="block p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-premier-gold/40 transition-colors"
                >
                  <p className="font-medium text-white text-sm">
                    {related.title_zh || related.title_en}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-zinc-500">
                    {related.caseNumber && <span>{related.caseNumber}</span>}
                    {related.court && <span>{related.court}</span>}
                    {related.judgmentDate && (
                      <span>{new Date(related.judgmentDate).toLocaleDateString('zh-HK')}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaItem({
  label,
  value,
  highlight,
}: {
  label: string
  value: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-premier-gold' : 'text-zinc-200'}`}>
        {value}
      </p>
    </div>
  )
}
