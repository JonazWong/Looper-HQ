import { en } from './locales/en'
import { zhHK } from './locales/zh-HK'

export type Locale = 'en' | 'zh-HK'

export const locales: Locale[] = ['en', 'zh-HK']

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'zh-HK': '繁體中文',
}

export const translations = {
  en,
  'zh-HK': zhHK,
}

export function getTranslation(locale: Locale) {
  return translations[locale] || translations[defaultLocale]
}
