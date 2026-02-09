# Looper HQ - AI Coding Agent Guidelines

## 🏛️ Project Overview

Looper HQ is a unified legal case management platform for Hong Kong built on:
- **Monorepo**: pnpm workspace with Turborepo (`apps/`, `services/`, `packages/`)
- **Frontend**: Next.js 15 + React 19 with App Router, TailwindCSS with custom "Premier Design System"
- **Backend**: REST APIs in `/api` routes, Prisma + PostgreSQL, NextAuth.js v5 + Keycloak
- **Stack**: TypeScript throughout, Zod validation, class-variance-authority for components

## 🔧 Development Workflow

**Setup**: `pnpm install → pnpm docker:up → pnpm db:push → pnpm db:seed → pnpm dev`

**Key Commands**:
- `pnpm dev` - Start all apps via Turborepo (parallel execution)
- `pnpm dev:web` - Main app (localhost:3000), `pnpm dev:legal` - Legal case search (localhost:3001)
- `pnpm db:studio` - Prisma Studio GUI at localhost:5555
- `pnpm db:push` - Push schema changes (dev only), `pnpm db:migrate` - Production migrations
- `pnpm lint`, `pnpm test`, `pnpm build` - All run via Turbo with caching

## 📁 Code Organization

### API Structure (`apps/web/app/api/`)
All API routes follow this standardized pattern:
```typescript
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { requireAuth, requireRole } from '@/lib/api/auth'
import { handleApiError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth() // Throws UnauthorizedError if not logged in
    const result = schema.safeParse(searchParams) // Zod validation
    if (!result.success) return validationErrorResponse(result.error.format())
    
    const data = await prisma.case.findMany({ where: filters })
    return successResponse(data, { page, perPage, total }) // Includes pagination meta
  } catch (error) {
    return handleApiError(error) // Maps custom errors to HTTP responses
  }
}
```

**Response Helpers** (`apps/web/lib/api/response.ts`):
- `successResponse(data, meta?)` - 200 with `{ success: true, data, meta? }`
- `errorResponse(message, status, code?, details?)` - Error with `{ success: false, error: { message, code, details } }`
- `validationErrorResponse(errors)` - 400 with formatted Zod errors
- `unauthorizedResponse()`, `forbiddenResponse()`, `notFoundResponse(resource)`

### Component Architecture (`apps/web/components/`)
- **UI Components**: `components/ui/` - shadcn/ui-style with `class-variance-authority`
  - Example: `button.tsx` (variants: default, destructive, outline, ghost, link; sizes: default, sm, lg, icon)
  - Example: `premier-button.tsx` (premier variants with gold/mystery colors + Framer Motion)
  - Example: `glass-card.tsx` (glass morphism with variants: default, gold, mystery, frosted)
- **Feature Components**: `components/{cases|clients|dashboard}/` - business logic with React Query
- **Layout Components**: `components/layout/` - AuthLayout and DashboardLayout
- **Route Groups**: `app/(auth)/` for login/signup, `app/(dashboard)/` for protected pages

### Database & Validation
- **Schema**: Single source in `packages/database/prisma/schema.prisma`
- **Client**: Singleton instance in `apps/web/lib/db.ts`, imported as `@/lib/db` (with dev logging)
- **Validation**: Zod schemas in `apps/web/lib/validations/schemas.ts` matching Prisma models
  - Pattern: `resourceSchema` + `resourceUpdateSchema` (using `.partial()`)
  - Type inference: `export type ResourceInput = z.infer<typeof resourceSchema>`
  - Shared utilities: `paginationSchema`, filter schemas

## 🎨 Design System - "Black Veil Empress" (`tailwind.config.ts`)

**Custom Colors**: 
- Premier blacks: `premier-black` (#0a0a0a), `premier-charcoal`, `premier-slate`
- Luxury golds: `premier-gold` (#D4AF37), `premier-gold-rose`, `premier-bronze`
- Mystery purples: `premier-purple`, `premier-mystery`, `premier-iris`
- Accents: `premier-pearl`, `premier-silver`, `premier-ruby`

**Component Patterns**:
- All UI components use `class-variance-authority` (`cva()`) for variant management
- Glass morphism: `glass-card.tsx` with blur effects and gradient borders
- Animations: Framer Motion with custom variants (`buttonHoverVariants`, `cardHoverVariants`)
- Shadows: `shadow-premier-glow`, `shadow-premier-glow-lg` for luxury effects

## 🔐 Authentication & Authorization (`apps/web/lib/api/auth.ts`)

NextAuth.js v5 with Keycloak provider:
```typescript
// Get session (returns null if not logged in)
const session = await getServerSession()

// Require auth (throws UnauthorizedError if not logged in)
const session = await requireAuth()

// Require specific role (throws ForbiddenError if wrong role)
const session = await requireRole('ADMIN', 'LAWYER')

// Permission checking
if (hasPermission(session, 'case:delete')) { /* allowed */ }
if (canAccessResource(session, resourceOwnerId)) { /* allowed */ }
```

**Roles & Permissions**: `ADMIN` (all), `LAWYER` (read/write/delete), `STAFF` (read-only), `CLIENT` (own resources)
**Multi-tenancy**: `Membership` model links users to organizations with role-based access

## 📊 Data Flow Patterns

**API Request Flow**: Request → Zod validation → Auth check → Prisma query → Response helper
**Cases/Clients**: Consistent filter → paginate → search pattern (see `apps/web/app/api/cases/route.ts`)
```typescript
// Query params: ?status=ACTIVE&search=contract&page=1&perPage=20
const filters = caseFilterSchema.safeParse(searchParams) // Zod parsing
const where = buildWhereClause(filters) // Build Prisma where
const total = await prisma.case.count({ where })
const cases = await prisma.case.findMany({ where, skip, take, include: { client, lawyer } })
return successResponse(cases, { page, perPage, total, totalPages })
```
**Frontend State**: React Query for server state, Zustand for client state
**Forms**: react-hook-form + Zod resolvers → API calls → toast notifications on success/error

## 🚨 Mandatory Pre-Change Analysis

Before ANY modification:
- **Database Changes**: Update Prisma schema → `pnpm db:push` → Update Zod schemas → Update API routes
- **API Changes**: Check all consumers (frontend components, external integrations)
- **Validation Sync**: Keep Zod schemas in `lib/validations/schemas.ts` aligned with Prisma models
- **Route Groups**: Respect `(auth)` vs `(dashboard)` boundaries (different layouts and auth contexts)
- **Component Changes**: Ensure `cva` variants maintain consistency across premier- theme

## 🚫 Prohibited Actions
- Breaking existing API response contracts (always `{ success, data?, error?, meta? }`)
- Simplifying features to reduce complexity without explicit approval
- Ignoring Premier Design System color/component patterns (no random colors)
- Direct database modifications bypassing Prisma ORM
- Mixing authentication contexts between route groups
- Adding dependencies without checking for vulnerabilities
