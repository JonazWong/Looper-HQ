# Icon Props Serialization Fix - Next.js 15 Compatibility

**Date**: 2024
**Issue**: Runtime error "Functions cannot be passed directly to Client Components" (Error digest: G62856084)
**Root Cause**: Server Components passing Lucide icon components as props to Client Components violates Next.js 15 serialization rules

## Problem

Next.js 15 enforces strict Server/Client Component boundaries. When Server Components try to pass non-serializable data (functions, React components, class instances) to Client Components, it throws a serialization error at runtime:

```
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
```

### Example of Problematic Code

```tsx
// ❌ Server Component
import { Plus } from 'lucide-react'
import { PremierButton } from '@/components/ui/premier-button'

export default function Page() {
  return <PremierButton icon={Plus}>Create</PremierButton>
  //                          ^^^^
  //                          Passing a React component (function)
}
```

## Solution

Changed `PremierButton` and `StatCard` to accept `React.ReactNode` instead of `LucideIcon` type for the `icon` prop. This allows passing JSX elements instead of component references.

### Component Changes

**1. PremierButton** (`apps/web/components/ui/premier-button.tsx`):
```tsx
// BEFORE
import { LucideIcon } from 'lucide-react'

export interface PremierButtonProps {
  icon?: LucideIcon  // ❌ Component type
  ...
}

// AFTER
export interface PremierButtonProps {
  icon?: React.ReactNode  // ✅ JSX element
  ...
}
```

**2. StatCard** (`apps/web/components/ui/stat-card.tsx`):
```tsx
// BEFORE
import { LucideIcon } from 'lucide-react'

export interface StatCardProps {
  icon?: LucideIcon  // ❌ Component type
  ...
}

// AFTER
export interface StatCardProps {
  icon?: React.ReactNode  // ✅ JSX element
  ...
}
```

### Usage Pattern Changes

**Simple Icons**:
```tsx
// BEFORE: ❌
<PremierButton icon={Plus}>Create</PremierButton>

// AFTER: ✅
<PremierButton icon={<Plus className="h-4 w-4" />}>Create</PremierButton>
```

**Conditional Icons**:
```tsx
// BEFORE: ❌
<PremierButton icon={loading ? Loader2 : Save} />

// AFTER: ✅
<PremierButton 
  icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
/>
```

## Files Modified

### Core Components (2 files)
- `apps/web/components/ui/premier-button.tsx`
- `apps/web/components/ui/stat-card.tsx`

### Server Component Pages (9 files, 49 icon props)

1. **time-tracking/page.tsx** (4 icons)
   - Plus, Clock, CheckCircle2, DollarSign, Calendar, Filter, Download

2. **documents/page.tsx** (8 icons)
   - Upload, FileText, File, FolderOpen, Eye, Download

3. **clients/page.tsx** (7 icons)
   - Plus, Users, User, Building2, Eye, Edit

4. **cases/page.tsx** (8 icons)
   - Plus, Briefcase, FolderOpen, Clock, CheckCircle2, Eye, Edit, Archive

5. **billing/page.tsx** (8 icons)
   - Plus, DollarSign, Clock, CheckCircle2, AlertCircle, Eye, Download

6. **cases/new/page.tsx** (4 icons with conditionals)
   - ArrowLeft
   - `searchingClients ? Loader2 : Search`
   - `searchingLawyers ? Loader2 : Search`
   - `loading ? Loader2 : Save`

7. **cases/[id]/page.tsx** (6 icons)
   - ArrowLeft, Edit, Upload, Download, Plus (x2)

8. **search/page.tsx** (3 icons)
   - SearchIcon, FileText, AlertCircle

9. **admin/ai-classify/page.tsx** (1 icon with conditional)
   - `processing ? Loader2 : Sparkles`

## Client Components (Not Modified)

The following Client Components (`'use client'`) can continue to use the old pattern because they operate entirely in the client environment:

- `components/translate-button.tsx`
- `components/search/search-form.tsx`
- `components/search/advanced-search-form.tsx`
- `components/language-switcher.tsx`
- `components/dashboard/dashboard-content.tsx` (uses iconMap pattern - already correct)
- `components/clients/clients-pagination.tsx`
- `components/clients/clients-filters.tsx`
- `components/cases/cases-pagination.tsx`
- `components/cases/cases-filters.tsx`
- `components/case/ai-classify-button.tsx`
- `components/ai/classify-button.tsx`

**Note**: Client Components may still trigger the warning in build logs if they use the old pattern, but they won't cause runtime errors. For consistency, they can be updated to the new pattern as well.

## Testing

### Verification Steps

1. **Local Build**:
   ```bash
   pnpm build
   ```
   Expected: No errors, warnings about serialization should be gone

2. **Local Run**:
   ```bash
   pnpm dev
   ```
   Expected: All pages load without runtime errors

3. **Check Error Logs**:
   - Before: `Error: Functions cannot be passed directly to Client Components`
   - After: No serialization errors

### Deployment

```bash
# Commit changes
git add .
git commit -m "fix: convert icon props to JSX elements for Next.js 15 serialization"
git push origin main
```

DigitalOcean App Platform will automatically deploy. Verify:
- Build succeeds
- Application runs without runtime errors
- Dashboard pages load correctly

## Related Documentation

- [Next.js 15 Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Server Components Serialization Rules](https://react.dev/reference/rsc/server-components#serializable-types)
- [DigitalOcean Deployment Fix](.do/APP_YAML_SOURCE_DIR_FIX.md)

## Future Best Practices

1. **Always use JSX elements** when passing icons to Client Components from Server Components
2. **Add className directly** to icon JSX (e.g., `<Plus className="h-4 w-4" />`)
3. **For conditional icons**, wrap both branches in JSX:
   ```tsx
   icon={condition ? <IconA className="..." /> : <IconB className="..." />}
   ```
4. **In Client Components**, either pattern works, but JSX elements are more consistent

## Impact

- ✅ Fixes runtime serialization error (G62856084)
- ✅ Enables successful DigitalOcean deployment
- ✅ Improves Next.js 15 compliance
- ✅ No breaking changes for Client Components
- ⚠️ Requires updating all Server Component icon usages (49 instances updated)
