import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// 支持的語言
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

// Development mode check (module-level constant)
const isDev = process.env.NODE_ENV === 'development';

export default getRequestConfig(async ({ locale }) => {
  
  // 驗證語言是否支持
  if (!locales.includes(locale as Locale)) {
    if (isDev) {
      console.error('[i18n] Unsupported locale requested:', locale);
    }
    notFound();
  }

  try {
    const messages = (await import(`./messages/${locale}.json`)).default;
    
    if (isDev) {
      console.log('[i18n] Messages loaded for locale:', locale);
    }
    
    return { 
      locale,
      messages 
    };
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale "${locale}":`, error);
    
    // In production, fall back to default locale
    if (!isDev && locale !== defaultLocale) {
      console.warn(`[i18n] Falling back to default locale: ${defaultLocale}`);
      try {
        const messages = (await import(`./messages/${defaultLocale}.json`)).default;
        return { 
          locale: defaultLocale,
          messages 
        };
      } catch (fallbackError) {
        console.error(`[i18n] Failed to load default locale messages:`, fallbackError);
        throw new Error(
          `Translation files are missing for both "${locale}" and "${defaultLocale}". ` +
          `Ensure translation files exist at ./messages/${locale}.json and ./messages/${defaultLocale}.json`
        );
      }
    }
    
    throw error;
  }
});
