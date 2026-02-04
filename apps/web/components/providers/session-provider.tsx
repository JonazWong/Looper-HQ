/**
 * NextAuth Session Provider
 * 
 * Wraps the application to provide session context to client components.
 * This must be a Client Component.
 * 
 * Usage in app/layout.tsx:
 * ```tsx
 * import { SessionProvider } from "@/components/providers/session-provider"
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <SessionProvider>{children}</SessionProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */

"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

interface SessionProviderProps {
  children: React.ReactNode
  session?: Session | null
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}
