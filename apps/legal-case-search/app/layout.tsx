import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Looper HQ - Legal Case Search',
  description: 'Hong Kong Legal Case Search Portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0a0a0a', color: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  )
}
