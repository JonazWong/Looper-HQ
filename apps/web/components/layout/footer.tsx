'use client'

import Link from "next/link"
import { useLocale } from 'next-intl'

export function Footer() {
  const locale = useLocale()
  
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col gap-4 py-8 px-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Looper HQ. All rights reserved.
        </div>
        <div className="flex gap-4">
          <Link
            href={`/${locale}/terms`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Terms of Service
          </Link>
          <Link
            href={`/${locale}/privacy`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}
