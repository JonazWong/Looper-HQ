import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'

interface Props {
  params: Promise<{ locale: string; court: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CourtPage({ params, searchParams }: Props) {
  const { locale, court } = await params
  const { page: pageStr } = await searchParams
  const courtName = decodeURIComponent(court)
  const page = Math.max(1, parseInt(pageStr || '1', 10))
  const limit = 20
  const skip = (page - 1) * limit

  const where = { court: { contains: courtName, mode: 'insensitive' as const } }

  const [cases, total] = await Promise.all([
    prisma.publicCase.findMany({
      where,
      skip,
      take: limit,
      orderBy: { crawledAt: 'desc' },
      select: {
        id: true,
        title_zh: true,
        title_en: true,
        caseNumber: true,
        neutralCitation: true,
        court: true,
        judge: true,
        judgmentDate: true,
        category: true,
        crawledAt: true,
      },
    }),
    prisma.publicCase.count({ where }),
  ])

  if (total === 0 && page === 1) notFound()

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-premier-black text-white p-6 lg:p-10">
      <nav className="mb-6 text-sm text-zinc-500 flex items-center gap-2">
        <Link href={`/${locale}/public-cases`} className="hover:text-premier-gold transition-colors">
          公開案例
        </Link>
        <span>/</span>
        <span className="text-zinc-300">法院</span>
        <span>/</span>
        <span className="text-zinc-300">{courtName}</span>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">{courtName}</h1>
          <p className="text-zinc-500">共 {total} 宗案例</p>
        </div>

        <div className="space-y-3">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/${locale}/public-cases/${c.id}`}
              className="block glass-card rounded-premier-lg p-5 border border-zinc-800 bg-zinc-900/50 hover:border-premier-gold/40 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <h2 className="text-base font-semibold text-white">{c.title_zh || c.title_en}</h2>
                {c.category && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-premier-gold/10 text-premier-gold border border-premier-gold/30 shrink-0">
                    {c.category}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                {c.caseNumber && <span>{c.caseNumber}</span>}
                {c.neutralCitation && <span className="text-premier-gold">{c.neutralCitation}</span>}
                {c.judge && <span>法官: {c.judge}</span>}
                {c.judgmentDate && (
                  <span>{new Date(c.judgmentDate).toLocaleDateString('zh-HK')}</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {page > 1 && (
              <Link
                href={`/${locale}/courts/${encodeURIComponent(court)}?page=${page - 1}`}
                className="px-4 py-2 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                上一頁
              </Link>
            )}
            <span className="text-sm text-zinc-500">
              第 {page} / {totalPages} 頁
            </span>
            {page < totalPages && (
              <Link
                href={`/${locale}/courts/${encodeURIComponent(court)}?page=${page + 1}`}
                className="px-4 py-2 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                下一頁
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
