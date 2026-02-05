import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calendar | Looper HQ',
  description: 'View your court dates and appointments',
}

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gradient-gold mb-2">
          Calendar
        </h1>
        <p className="text-premier-pearl-gray">
          Court dates and appointments calendar
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
          Calendar Coming Soon
        </h2>
        <p className="text-premier-pearl-gray">
          Court dates and appointment scheduling will be available here.
        </p>
      </div>
    </div>
  )
}
