# Bilingual Language Switch - Visual Guide

## URL Structure

### Chinese (繁體中文) - Default
```
https://looper-hq.com/zh/
https://looper-hq.com/zh/dashboard
https://looper-hq.com/zh/dashboard/cases
https://looper-hq.com/zh/dashboard/clients
https://looper-hq.com/zh/login
```

### English
```
https://looper-hq.com/en/
https://looper-hq.com/en/dashboard
https://looper-hq.com/en/dashboard/cases
https://looper-hq.com/en/dashboard/clients
https://looper-hq.com/en/login
```

## Language Switcher UI

Located in the Header component (top-right):

```
┌─────────────────────────────────────────────────────────┐
│  [Looper HQ Logo]   Dashboard  Cases  Clients  Search  │
│                                                          │
│                   🔔  [🇭🇰 繁體中文 ▼]  [👤]           │
└─────────────────────────────────────────────────────────┘
```

### Dropdown Menu
When clicked, shows:
```
┌─────────────────┐
│ 🇭🇰 繁體中文    │ ← Currently selected (highlighted)
│ 🇬🇧 English     │
└─────────────────┘
```

## Translation Examples

### Navigation (Header & Sidebar)

| Key | Chinese (zh) | English (en) |
|-----|-------------|--------------|
| nav.home | 首頁 | Home |
| nav.dashboard | 儀表板 | Dashboard |
| nav.cases | 案例管理 | Cases |
| nav.clients | 客戶管理 | Clients |
| nav.search | 公開搜尋 | Public Search |
| nav.documents | 文件 | Documents |
| nav.settings | 設定 | Settings |
| nav.logout | 登出 | Logout |

### Common UI Elements

| Key | Chinese (zh) | English (en) |
|-----|-------------|--------------|
| common.appName | Looper HQ | Looper HQ |
| common.search | 搜尋 | Search |
| common.save | 儲存 | Save |
| common.loading | 載入中... | Loading... |
| common.edit | 編輯 | Edit |
| common.delete | 刪除 | Delete |

### Case Management

| Key | Chinese (zh) | English (en) |
|-----|-------------|--------------|
| case.title | 案例標題 | Case Title |
| case.category | 類別 | Category |
| case.court | 法院 | Court |
| case.status | 狀態 | Status |
| case.priority | 優先級 | Priority |

### Case Statuses

| Status | Chinese (zh) | English (en) |
|--------|-------------|--------------|
| ACTIVE | 進行中 | Active |
| PENDING | 待處理 | Pending |
| COMPLETED | 已完成 | Completed |
| ARCHIVED | 已封存 | Archived |
| CANCELLED | 已取消 | Cancelled |

### Case Categories

| Category | Chinese (zh) | English (en) |
|----------|-------------|--------------|
| CIVIL | 民事 | Civil |
| CRIMINAL | 刑事 | Criminal |
| CORPORATE | 公司 | Corporate |
| FAMILY | 家事 | Family |
| PROPERTY | 物業 | Property |
| EMPLOYMENT | 勞工 | Employment |
| INTELLECTUAL_PROPERTY | 知識產權 | Intellectual Property |

## User Flow Example

### Scenario: User switches from Chinese to English

1. **Initial State** (Chinese)
   - URL: `/zh/dashboard/cases`
   - Header shows: "🇭🇰 繁體中文 ▼"
   - Page title: "案例管理"
   - Button text: "新增", "搜尋", "篩選"

2. **User clicks language switcher**
   - Dropdown opens showing both languages
   - Current language (繁體中文) is highlighted

3. **User selects "English"**
   - URL changes to: `/en/dashboard/cases`
   - Header updates to: "🇬🇧 English ▼"
   - Page title changes to: "Cases"
   - Button text changes to: "Create", "Search", "Filter"
   - Page content updates without full page reload

## Component Integration Examples

### Header Component
```tsx
// File: components/layout/header.tsx
const t = useTranslations()
const locale = useLocale()

<Link href={`/${locale}/dashboard`}>
  {t('nav.dashboard')}
</Link>
```

### Sidebar Component
```tsx
// File: components/layout/sidebar.tsx
const sidebarItems = [
  { labelKey: "dashboard", href: `/${locale}/dashboard` },
  { labelKey: "cases", href: `/${locale}/dashboard/cases` },
  { labelKey: "clients", href: `/${locale}/dashboard/clients` },
]

{sidebarItems.map(item => (
  <Link href={item.href}>
    {t(`nav.${item.labelKey}`)}
  </Link>
))}
```

## Middleware Flow

```
User requests → Middleware → i18n middleware → Auth middleware → Route
                     ↓
              Check locale in URL
                     ↓
              /zh/* or /en/* ?
                     ↓
           YES: Continue    NO: Redirect to /zh/*
                     ↓
              Load translations
                     ↓
              Check authentication
                     ↓
              Render page
```

## Translation File Structure

```json
{
  "common": { ... },      // Common UI elements
  "nav": { ... },         // Navigation items
  "search": { ... },      // Search interface
  "case": { ... },        // Case management
  "auth": { ... },        // Authentication
  "dashboard": { ... },   // Dashboard
  "clients": { ... },     // Client management
  "documents": { ... },   // Document management
  "billing": { ... },     // Billing
  "timeTracking": { ... },// Time tracking
  "ai": { ... },          // AI features
  "footer": { ... }       // Footer
}
```

## Key Features

✅ **URL-based locale routing** - SEO friendly, shareable links
✅ **No page refresh** - Smooth transitions between languages
✅ **Comprehensive coverage** - 12 translation sections, 190+ keys
✅ **Consistent structure** - Same keys in both languages
✅ **Premier Design System** - Styled language switcher with flags
✅ **Server & Client support** - Works in both component types
✅ **Combined middleware** - Works seamlessly with authentication
✅ **Type-safe** - TypeScript support throughout

## Testing the Implementation

### Manual Testing Steps

1. **Visit root URL**
   ```
   Navigate to: http://localhost:3005/
   Expected: Redirects to /zh/
   ```

2. **Check Chinese interface**
   ```
   Navigate to: /zh/dashboard
   Expected: 
   - Header shows "儀表板"
   - Sidebar shows "案例管理", "客戶管理"
   - Language switcher shows "🇭🇰 繁體中文"
   ```

3. **Switch to English**
   ```
   Click language switcher → Select "English"
   Expected:
   - URL changes to /en/dashboard
   - Header shows "Dashboard"
   - Sidebar shows "Cases", "Clients"
   - Language switcher shows "🇬🇧 English"
   ```

4. **Navigate between pages**
   ```
   Click "Cases" in sidebar
   Expected: URL is /en/dashboard/cases (maintains locale)
   ```

5. **Direct URL access**
   ```
   Navigate to: /en/dashboard/clients
   Expected: Page loads in English
   
   Navigate to: /zh/dashboard/clients
   Expected: Page loads in Chinese
   ```

### Expected Results

✅ All navigation items translated correctly
✅ Page content reflects selected language
✅ URL always includes locale prefix
✅ Language preference persists across navigation
✅ No console errors
✅ Smooth transitions without flickering

## Implementation Summary

The bilingual system is **fully implemented and production-ready**:

- ✅ Configuration complete
- ✅ Translations comprehensive
- ✅ UI components integrated
- ✅ Middleware configured
- ✅ Tests created
- ✅ Documentation complete

**Priority**: P0 - Core Functionality
**Status**: ✅ **COMPLETE**
