import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Legal Case Search - Looper HQ',
  description: 'Hong Kong Legal Case Management and Search Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
