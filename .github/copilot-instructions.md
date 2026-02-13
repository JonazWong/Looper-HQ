# Looper HQ - AI Coding Agent Guidelines

## 🏛️ Project Overview

Looper HQ is a unified legal case management platform for Hong Kong built on:
- **Monorepo**: pnpm workspace with Turborepo (`apps/`, `services/`, `packages/`)
- **Frontend**: Next.js 15 + React 19 with App Router, TailwindCSS with custom "Premier Design System"
- **Backend**: REST APIs in `/api` routes, Prisma + PostgreSQL 16, NextAuth.js v5
- **Stack**: TypeScript throughout, Zod validation, class-variance-authority for components
- **Node Version**: 18.0.0+ required (CI uses Node 20)
- **Package Manager**: pnpm 8+ (lockfile version 8.15.0)

## 🔧 Development Workflow

**CRITICAL**: Always follow this exact sequence for first-time setup:

```bash
# 1. Install dependencies (MUST be first - generates Prisma Client via postinstall)
pnpm install --frozen-lockfile

# 2. Copy environment file
cp .env.example .env

# 3. Start Docker services (PostgreSQL 16 on :5432, Redis on :6379, Keycloak on :8080)
pnpm docker:up

# 4. Wait 10-15 seconds for PostgreSQL to be ready, then sync database schema
pnpm db:push

# 5. Seed database with test data (optional but recommended)
pnpm db:seed

# 6. Start development servers
pnpm dev        # Web app on :3005
pnpm dev:legal  # Legal case search on :3001  
pnpm dev:all    # Both apps in parallel
```

**Key Commands**:
- `pnpm dev` - Start all apps via Turborepo
- `pnpm --filter=@looper-hq/database prisma studio` - Database GUI on :5555
- `pnpm db:push` - Sync Prisma schema to DB (dev only, no migrations)
- `pnpm db:migrate` - Create and apply migrations (production workflow)

**IMPORTANT**: After modifying `packages/database/prisma/schema.prisma`, you MUST run `pnpm --filter=@looper-hq/database prisma generate` before building/testing.

## 📁 Code Organization

### API Structure
All APIs in `apps/web/app/api/` follow this pattern:
```typescript
// Example from apps/web/app/api/cases/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse 
} from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth } from '@/lib/api/auth'
import { caseSchema, paginationSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams

    // Parse and validate pagination
    const paginationResult = paginationSchema.safeParse({
      page: searchParams.get('page'),
      perPage: searchParams.get('perPage'),
    })

    if (!paginationResult.success) {
      return validationErrorResponse(paginationResult.error.format())
    }

    const { page, perPage } = paginationResult.data

    // Query database
    const total = await prisma.case.count()
    const cases = await prisma.case.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(cases, {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
```

### Component Architecture
- **UI Components**: `components/ui/` - shadcn/ui-style with cva variants
- **Feature Components**: `components/{cases|clients|dashboard}/` - business logic
- **Layout Components**: `components/layout/` - auth/dashboard layouts
- **Route Groups**: `app/(auth)/` and `app/(dashboard)/` with nested layouts

### Database & Validation
- **Schema**: Single Prisma schema in `packages/database/prisma/schema.prisma`
- **Validation**: Zod schemas in `apps/web/lib/validations/schemas.ts` matching Prisma models
- **Client**: PrismaClient singleton in `apps/web/lib/db.ts`, imported as `@/lib/db`
- **Package**: `packages/database` re-exports `@prisma/client` for workspace sharing

## 🎨 Design System - "Black Veil Empress"

**Colors**: Premier black backgrounds (`#0a0a0a`), luxury golds (`#D4AF37`), mystery purples
**Components**: All use `class-variance-authority` with premier- prefixed custom colors
**Styling**: Glass morphism effects via `glass-card.tsx`, gradient borders via `gradient-border.tsx`

## 🔐 Authentication & Authorization

NextAuth.js v5 with optional Keycloak OAuth provider:
- Session via `requireAuth()` in API routes
- User roles: `ADMIN | LAWYER | CLIENT | STAFF` (see Prisma schema)
- Multi-tenant via `Membership` model
- Credentials provider for local development (when Keycloak not configured)
- Keycloak provider enabled when `KEYCLOAK_CLIENT_ID` and `KEYCLOAK_ISSUER` are set

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

## 🧪 Testing & Validation

**Test Framework**: Vitest with React Testing Library
- **Config**: `apps/web/vitest.config.ts` (happy-dom environment)
- **Run Tests**: `pnpm test` (from root) or `pnpm --filter=@looper-hq/web test`
- **Coverage**: `pnpm --filter=@looper-hq/web test:coverage`
- **NOTE**: Test suite is minimal - tests are currently commented out in CI pipeline

**Linting & Type Checking**:
```bash
pnpm lint           # ESLint across all packages
pnpm build          # Type-check via tsc during build (no actual output in some configs)
pnpm --filter=@looper-hq/web type-check  # Explicit type check
```

**CI Pipeline Validation** (`.github/workflows/ci.yml`):
1. `pnpm install --frozen-lockfile` - Ensure lockfile is not modified
2. `pnpm --filter=@looper-hq/database prisma generate` - Generate client
3. `pnpm lint` - Lint check (continues on error)
4. `pnpm build` - Full build verification
5. Tests are disabled in CI but should work locally

**Common Build Issues**:
- **Prisma Client not found**: Run `pnpm --filter=@looper-hq/database prisma generate`
- **Type errors in Next.js API routes**: Ensure `@/lib/db` import path exists
- **Module resolution errors**: Check `tsconfig.json` paths and workspace references
- **Build timeout**: `pnpm build` can take 2-3 minutes on first run (caching helps)

## 🗃️ Monorepo Structure & Dependencies

**Apps** (Next.js applications):
- `apps/web` - Main dashboard (port 3005), depends on: `@looper-hq/database`, `@looper-hq/types`, `@looper-hq/utils`
- `apps/legal-case-search` - Case search portal (port 3001), depends on: `@looper-hq/database`

**Packages** (shared libraries):
- `packages/database` - Prisma schema & client (foundational, no dependencies)
- `packages/types` - TypeScript definitions (no dependencies)
- `packages/utils` - Utility functions (no dependencies)
- `packages/config` - Configuration presets (no dependencies)
- `packages/migration` - Data migration scripts (depends on: `@looper-hq/database`)

**Services** (currently empty, reserved for future microservices)

**Critical Path**: Database changes → Update `schema.prisma` → Run `prisma generate` → Update Zod schemas in `apps/web/lib/validations/schemas.ts` → Update API routes → Update UI components

## 🚨 Environment Setup Requirements

**Required Environment Variables** (see `.env.example`):
```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"

# NextAuth (REQUIRED for authentication)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3005"

# Keycloak OAuth (OPTIONAL - credentials provider works without it)
KEYCLOAK_CLIENT_ID="looper-hq-web"
KEYCLOAK_ISSUER="http://localhost:8080/realms/looper-hq"

# OpenAI (OPTIONAL - for AI features)
OPENAI_API_KEY="sk-..."
```

**Docker Services** (`infrastructure/docker/docker-compose.yml`):
- **PostgreSQL 16**: Port 5432, user: postgres, pass: postgres, db: looper_hq
- **Redis 7**: Port 6379 (no password by default)
- **Keycloak 23**: Port 8080, admin/admin, realm: looper-hq
- **pgAdmin 4** (optional): Port 5050, admin@looper-hq.dev/admin

All services have health checks and auto-restart policies.

## 🛠️ Common Workflows & Troubleshooting

**Starting Fresh**:
```bash
pnpm docker:down              # Stop all containers
docker volume prune -f        # Clear database data
pnpm install --frozen-lockfile
pnpm docker:up
sleep 15                      # Wait for DB
pnpm db:push && pnpm db:seed
```

**Schema Changes**:
```bash
# Edit packages/database/prisma/schema.prisma
pnpm --filter=@looper-hq/database prisma generate  # Regenerate client
pnpm db:push                                        # Sync to DB (dev)
# Update apps/web/lib/validations/schemas.ts        # Keep Zod in sync
```

**Database Issues**:
- **Connection refused**: Check `pnpm docker:up` and wait 15 seconds
- **Migration conflicts**: Use `pnpm db:push` for dev, `pnpm db:migrate` for production
- **Seed fails**: Ensure `db:push` completed successfully first
- **Port conflict (5432)**: Check if another PostgreSQL is running

**Authentication Issues**:
- **Keycloak not required**: App works with credentials provider (email/password)
- **Session errors**: Verify `NEXTAUTH_SECRET` is set in `.env`
- **Redirect loops**: Check `NEXTAUTH_URL` matches your dev server port

## 🚫 Prohibited Actions
- Breaking existing API contracts without migration plan
- Simplifying features to reduce complexity without explicit approval  
- Ignoring the Premier Design System color/component patterns
- Direct database modifications bypassing Prisma
- Mixing authentication contexts between route groups
- Modifying `pnpm-lock.yaml` manually (always use `pnpm install`)
- Running `prisma db push` in production (use `prisma migrate` instead)
