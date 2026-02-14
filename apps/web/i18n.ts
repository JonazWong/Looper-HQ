import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// 支持的語言
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

export default getRequestConfig(async ({ locale }) => {
  // 驗證語言是否支持
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
