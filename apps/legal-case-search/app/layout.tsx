import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: '香港法律案件搜尋 | HK Legal Case Search',
  description: '搜尋香港法律案件、判決書及法律新聞 | Search Hong Kong legal cases, judgments, and legal news',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="zh-HK">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#0a0a0a', color: '#F5F5F5' }}>
        {children}
      </body>
    </html>
  )
}
