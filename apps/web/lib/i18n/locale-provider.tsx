'use client'

/**
 * Locale Provider - Client Component for language management
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, defaultLocale, getTranslation } from '@/lib/i18n'
import { TranslationKeys } from '@/lib/i18n/locales/en'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationKeys
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const LOCALE_STORAGE_KEY = 'looper-hq-locale'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [mounted, setMounted] = useState(false)

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'zh-HK')) {
      setLocaleState(savedLocale)
    }
    setMounted(true)
  }, [])

  // Save locale to localStorage when it changes
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
  }

  const t = getTranslation(locale)

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return context
}
