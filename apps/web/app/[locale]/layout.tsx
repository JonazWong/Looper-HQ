import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import '../../styles/globals.css';

// Development mode check (module-level constant)
const isDev = process.env.NODE_ENV === 'development';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const isZh = locale === 'zh';
  
  return {
    title: isZh ? "Looper HQ - 香港法律案例管理平台" : "Looper HQ - Legal Case Management Platform",
    description: isZh 
      ? "Looper HQ - 香港統一企業級法律案例管理系統"
      : "Looper HQ - Unified enterprise-grade legal case management system for Hong Kong",
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  
  if (isDev) {
    console.log('[LocaleLayout] Received locale:', locale);
  }

  // Validate locale
  if (!locale || !locales.includes(locale as any)) {
    if (isDev) {
      console.error('[LocaleLayout] Invalid locale:', locale, 'Valid locales:', locales);
    }
    notFound();
  }

  const messages = await getMessages();

  if (isDev) {
    console.log('[LocaleLayout] Messages loaded for locale:', locale, 'Keys:', Object.keys(messages).length);
  }

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
