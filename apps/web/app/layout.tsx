import '@/styles/globals.css'
import { defaultLocale } from '@/i18n'

/**
 * Root Layout
 * 
 * This layout renders the base HTML structure for ALL routes, including:
 * - API routes like /api/auth/* (NextAuth endpoints)
 * - Locale-specific routes like /[locale]/* 
 * 
 * IMPORTANT: Do NOT redirect here as it will break API routes.
 * Locale redirection is handled by middleware and /page.tsx.
 * 
 * Note: The lang attribute uses defaultLocale for non-locale routes.
 * Locale-specific pages override this in app/[locale]/layout.tsx.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}

