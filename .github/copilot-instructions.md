# Looper HQ - AI Coding Agent Guidelines

## 🏛️ Project Overview

Looper HQ is a unified legal case management platform for Hong Kong built on:
- **Monorepo**: pnpm workspace with Turborepo (`apps/`, `services/`, `packages/`)
- **Frontend**: Next.js 15 + React 19 with App Router, TailwindCSS with custom "Premier Design System"
- **Backend**: REST APIs in `/api` routes, Prisma + PostgreSQL, NextAuth.js + Keycloak
- **Stack**: TypeScript throughout, Zod validation, class-variance-authority for components

## 🔧 Development Workflow

**Setup**: `pnpm install → pnpm docker:up → pnpm db:push → pnpm db:seed → pnpm dev`

**Key Commands**:
- `pnpm dev` - Start all apps via Turborepo
- `pnpm --filter=@looper-hq/database prisma studio` - Database GUI
- `pnpm --filter=@looper-hq/web db:push` - Push schema changes

## 📁 Code Organization

### API Structure
All APIs in `apps/web/app/api/` follow this pattern:
```typescript
// Zod validation → Auth check → Prisma operations → Standardized responses
export async function GET(request: NextRequest) {
  const session = await requireAuth()
  const result = schema.safeParse(params)
  return successResponse(data) | errorResponse()
}
```

### Component Architecture
- **UI Components**: `components/ui/` - shadcn/ui-style with cva variants
- **Feature Components**: `components/{cases|clients|dashboard}/` - business logic
- **Layout Components**: `components/layout/` - auth/dashboard layouts
- **Route Groups**: `app/(auth)/` and `app/(dashboard)/` with nested layouts

### Database & Validation
- **Schema**: Single Prisma schema in `packages/database/prisma/schema.prisma`
- **Validation**: Zod schemas in `lib/validations/schemas.ts` matching Prisma models
- **Client**: Shared `@looper-hq/database` package, imported as `@/lib/db`

## 🎨 Design System - "Black Veil Empress"

**Colors**: Premier black backgrounds (`#0a0a0a`), luxury golds (`#D4AF37`), mystery purples
**Components**: All use `class-variance-authority` with premier- prefixed custom colors
**Styling**: Glass morphism effects via `glass-card.tsx`, gradient borders via `gradient-border.tsx`

## 🔐 Authentication & Authorization

NextAuth.js v5 with Keycloak provider:
- Session via `requireAuth()` in API routes
- User roles: `ADMIN | LAWYER | CLIENT | STAFF` (see Prisma schema)
- Multi-tenant via `Membership` model

## 📊 Data Flow Patterns

**Cases/Clients**: Filter → Paginate → Search pattern in both API and UI
**Real-time**: Uses React Query for caching/state management
**Forms**: react-hook-form + Zod resolvers with consistent error handling

## 🚨 Mandatory Pre-Change Analysis

Before ANY modification:
- **Impact Assessment**: Analyze cross-component dependencies 
- **Chain Reactions**: Database changes require schema + API + UI updates
- **Validation Sync**: Keep Zod schemas aligned with Prisma models
- **Route Groups**: Respect `(auth)` vs `(dashboard)` boundaries

## 🚫 Prohibited Actions
- Breaking existing API contracts without migration plan
- Simplifying features to reduce complexity without explicit approval  
- Ignoring the Premier Design System color/component patterns
- Direct database modifications bypassing Prisma
- Mixing authentication contexts between route groups
