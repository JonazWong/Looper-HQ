import '@/styles/globals.css'

/**
 * Root Layout
 * 
 * This layout renders the base HTML structure for ALL routes, including:
 * - API routes like /api/auth/* (NextAuth endpoints)
 * - Locale-specific routes like /[locale]/* 
 * 
 * IMPORTANT: Do NOT redirect here as it will break API routes.
 * Locale redirection is handled by middleware and /page.tsx.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}

