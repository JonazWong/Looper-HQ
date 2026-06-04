import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'calendar' })

  return {
    title: `${t('title')} | Looper HQ`,
    description: t('subtitle'),
  }
}

export default async function CalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'calendar' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gradient-gold mb-2">
          {t('title')}
        </h1>
        <p className="text-premier-pearl-gray">
          {t('subtitle')}
        </p>
      </div>

      <div className="glass-card p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-premier-gold/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-premier-pearl mb-2">
          {t('comingSoonTitle')}
        </h2>
        <p className="text-premier-pearl-gray">
          {t('comingSoonDescription')}
        </p>
      </div>
    </div>
  )
}
