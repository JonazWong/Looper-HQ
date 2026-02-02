import type { Metadata } from "next"
import "../styles/globals.css"

export const metadata: Metadata = {
  title: "Looper HQ - Legal Case Management",
  description: "Unified Legal Case Management & Inquiry Platform for Hong Kong",
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
