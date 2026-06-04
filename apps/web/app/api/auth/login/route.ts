import { NextRequest, NextResponse } from "next/server"
import { defaultLocale, locales } from "@/i18n"

function parseLocaleFromUrl(urlString: string | null): string | null {
  if (!urlString) return null

  try {
    const url = new URL(urlString)
    const parts = url.pathname.split("/").filter(Boolean)
    const candidate = parts[0]
    if (candidate && locales.includes(candidate as typeof locales[number])) {
      return candidate
    }
  } catch {
    // ignore invalid referer
  }

  return null
}

function sanitizeCallbackUrl(callbackUrl: string | null, req: NextRequest) {
  if (!callbackUrl) return null

  try {
    const url = new URL(callbackUrl, req.url)
    if (url.origin !== req.nextUrl.origin) return null
    if (!url.pathname.startsWith("/")) return null
    if (url.pathname.startsWith("//")) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const explicitLocale = req.nextUrl.searchParams.get("locale")
  const refererLocale = parseLocaleFromUrl(req.headers.get("referer"))
  const locale = explicitLocale || refererLocale || defaultLocale

  const redirectUrl = new URL(`/${locale}/login`, req.url)
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key === "locale") return
    if (key === "callbackUrl") {
      const safeCallbackUrl = sanitizeCallbackUrl(value, req)
      if (safeCallbackUrl) {
        redirectUrl.searchParams.set(key, safeCallbackUrl)
      }
      return
    }
    redirectUrl.searchParams.set(key, value)
  })

  return NextResponse.redirect(redirectUrl)
}
