import { redirect } from 'next/navigation'
import { defaultLocale } from '@/i18n'

// Root layout - redirects to default locale
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout will only be used for the root path "/"
  // Redirect to default locale
  redirect(`/${defaultLocale}`)
}

