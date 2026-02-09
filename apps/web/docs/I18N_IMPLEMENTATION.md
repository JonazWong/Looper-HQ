# Bilingual System Implementation (中英雙語系統)

## Overview

This document describes the implementation of a complete Chinese-English bilingual switching system for Looper HQ using next-intl.

## Features Implemented

### ✅ Core Infrastructure (P0)

1. **next-intl Integration**
   - Configured in `next.config.js`
   - Configuration file: `i18n.ts`
   - Supported locales: `zh` (繁體中文), `en` (English)
   - Default locale: `zh`

2. **Translation Files**
   - `messages/zh.json` - Traditional Chinese translations
   - `messages/en.json` - English translations
   - Comprehensive coverage of:
     - Common UI elements
     - Navigation
     - Search interface
     - Case management
     - Authentication
     - Dashboard
     - AI features

3. **URL-based Routing**
   - All routes prefixed with locale: `/zh/*` or `/en/*`
   - Root path `/` redirects to `/zh`
   - Middleware handles locale detection and routing

4. **Middleware Integration**
   - Combined next-intl with NextAuth.js v5
   - Preserves authentication logic
   - Adds internationalization layer
   - Public routes: login, register, case-search, etc.
   - Protected routes: dashboard and all sub-pages

### ✅ App Router Structure (P0)

- Restructured to `app/[locale]/` pattern
- Route groups migrated:
  - `(auth)` - Login and registration pages
  - `(dashboard)` - Protected dashboard pages
- All pages now locale-aware

### ✅ Components & UI (P0)

1. **LanguageSwitcher Component**
   - Location: `components/language-switcher.tsx`
   - Premier Design System styling
   - Dropdown menu with flag icons
   - Integrated into Header component

2. **Updated Components**
   - `Header` - Uses `useTranslations()` from next-intl
   - `Sidebar` - Uses `useTranslations()` from next-intl
   - All nav items dynamically translated

3. **Removed Legacy Code**
   - Old `LocaleProvider` from `lib/i18n/locale-provider.tsx`
   - Old language-switcher from layout directory

### ✅ AI Translation Service (P0)

1. **Translator Service**
   - Location: `lib/services/translator.ts`
   - OpenAI GPT-4o-mini integration
   - Features:
     - Legal context-aware translation
     - Auto-detect language direction
     - Batch translation support
     - Specialized for Hong Kong legal terminology

2. **Translation Functions**
   ```typescript
   translateText(text, direction, context)
   batchTranslate(texts, direction)
   autoTranslate(text)
   ```

### ✅ Translation API & Components (P1)

1. **API Endpoint**
   - Location: `app/api/translate/route.ts`
   - POST endpoint
   - Zod validation
   - Supports auto-detection

2. **TranslateButton Component**
   - Location: `components/translate-button.tsx`
   - One-click translation
   - Loading states
   - Error handling
   - Premier Design System styling

## Usage

### Using Translations in Components

**Client Components:**
```tsx
'use client'
import { useLocale, useTranslations } from 'next-intl'

export function MyComponent() {
  const locale = useLocale() // 'zh' or 'en'
  const t = useTranslations()
  
  return (
    <div>
      <h1>{t('common.appName')}</h1>
      <p>{t('dashboard.subtitle')}</p>
    </div>
  )
}
```

**Server Components:**
```tsx
import { useTranslations } from 'next-intl'

export default function Page() {
  const t = useTranslations()
  
  return <h1>{t('search.title')}</h1>
}
```

### Language Switching

The `LanguageSwitcher` component is already integrated in the Header. Users can:
1. Click the language dropdown (shows current language with flag)
2. Select desired language
3. Page automatically updates without refresh
4. URL changes to reflect new locale

### Using AI Translation

**Via API:**
```typescript
const response = await fetch('/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Your text here',
    direction: 'auto', // or 'zh-to-en' or 'en-to-zh'
    context: 'legal' // or 'general'
  })
})
const { data } = await response.json()
console.log(data.translatedText)
```

**Via Component:**
```tsx
import { TranslateButton } from '@/components/translate-button'

<TranslateButton
  text="Text to translate"
  onTranslated={(translated) => console.log(translated)}
/>
```

## Configuration

### Environment Variables

Add to `.env.local`:
```bash
# Required for AI translation
OPENAI_API_KEY=sk-your-api-key-here

# Required for NextAuth
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=your-secret-here
```

### Supported Languages

Currently configured languages in `i18n.ts`:
- `zh` - 繁體中文 (Traditional Chinese) - **Default**
- `en` - English

To add more languages:
1. Add locale to `i18n.ts`: `export const locales = ['zh', 'en', 'fr'] as const;`
2. Create translation file: `messages/fr.json`
3. Update `LanguageSwitcher` component to include new language

## File Structure

```
apps/web/
├── i18n.ts                          # next-intl configuration
├── messages/
│   ├── zh.json                      # Chinese translations
│   └── en.json                      # English translations
├── middleware.ts                     # Combined next-intl + NextAuth
├── app/
│   ├── layout.tsx                   # Root redirect
│   ├── page.tsx                     # Root redirect
│   ├── [locale]/                    # Locale-aware routes
│   │   ├── layout.tsx              # Locale layout with provider
│   │   ├── page.tsx                # Home page
│   │   ├── (auth)/                 # Auth route group
│   │   └── (dashboard)/            # Dashboard route group
│   └── api/
│       └── translate/
│           └── route.ts            # Translation API
├── components/
│   ├── language-switcher.tsx       # Language switching UI
│   ├── translate-button.tsx        # Translation button
│   └── layout/
│       ├── header.tsx              # Updated with translations
│       └── sidebar.tsx             # Updated with translations
└── lib/
    └── services/
        └── translator.ts           # AI translation service
```

## Migration from Old System

The old i18n system used:
- Client-side localStorage for language preference
- Context API with `LocaleProvider`
- Manual translation objects

The new system uses:
- URL-based locale routing
- next-intl for translations
- Server and client component support
- Better SEO with locale URLs

## Testing

### Manual Testing Checklist

- [ ] Visit `/` - should redirect to `/zh`
- [ ] Visit `/zh` - should show Chinese interface
- [ ] Visit `/en` - should show English interface
- [ ] Click language switcher - should switch language without page refresh
- [ ] Navigate between pages - URL should maintain locale prefix
- [ ] Test authentication flow - should work with locale prefixes
- [ ] Test AI translation (if OPENAI_API_KEY is set)

### Running Tests

```bash
# Type check
npm run type-check

# Run tests
npm test

# Start dev server
npm run dev
```

## Troubleshooting

### Issue: "Could not locate request configuration module"
**Solution:** Ensure `next.config.js` points to correct path:
```javascript
const withNextIntl = createNextIntlPlugin('./i18n.ts');
```

### Issue: Translations not showing
**Solution:** 
1. Check translation key exists in both `zh.json` and `en.json`
2. Verify component imports `useTranslations()` correctly
3. Check browser console for errors

### Issue: Language switcher not working
**Solution:**
1. Ensure pathname includes locale prefix
2. Check middleware is running
3. Verify `LanguageSwitcher` is inside client component

## Performance

- **Translation files**: Loaded on-demand per locale
- **Static generation**: Supports `generateStaticParams` for locales
- **No client-side overhead**: Translations loaded server-side
- **Caching**: Next.js automatically caches locale pages

## Security

- **AI Translation**: Requires OPENAI_API_KEY (not exposed to client)
- **API Rate Limiting**: Consider adding for `/api/translate`
- **Input Validation**: Zod schema validates translation requests
- **XSS Protection**: All translations properly escaped

## Future Enhancements

Potential improvements:
1. Add more languages (e.g., Simplified Chinese, French)
2. Implement translation memory/caching
3. Add language preference detection from browser
4. Create admin panel for managing translations
5. Add pluralization support
6. Implement translation fallbacks

## References

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [OpenAI API](https://platform.openai.com/docs/api-reference)

---

**Implementation Date:** February 2026
**Version:** 1.0.0
**Status:** ✅ Complete and Ready for Testing
