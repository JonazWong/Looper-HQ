import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import '../../styles/globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const isZh = locale === 'zh';
  
  return {
    title: isZh ? "Looper HQ Nexus-L - 香港法律案例管理平台" : "Looper HQ Nexus-L - Legal Case Management Platform",
    description: isZh 
      ? "Nexus Legal - 香港統一企業級法律案例管理系統"
      : "Nexus Legal - Unified enterprise-grade legal case management system for Hong Kong",
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

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
