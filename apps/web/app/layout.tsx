import type { Metadata } from "next"
import "../styles/globals.css"

export const metadata: Metadata = {
  title: "Looper HQ Nexus-L - Legal Case Management Platform",
  description: "Nexus Legal - Unified enterprise-grade legal case management system for Hong Kong",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
