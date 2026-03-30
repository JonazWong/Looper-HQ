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

# 3. Start Docker services (PostgreSQL 16 on :5433, Redis on :6380, Keycloak on :8080)
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
- `pnpm db:migrate` - Create and apply migrations in development (uses `prisma migrate dev`)

**IMPORTANT**: After modifying `packages/database/prisma/schema.prisma`, you MUST run `pnpm --filter=@looper-hq/database prisma generate` before building/testing.

## 📁 Code Organization

### API Structure
All APIs in `apps/web/app/api/` follow this **mandatory pattern**:

```typescript
// Required imports for every API route
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth, requireRole } from '@/lib/api/auth'
import { caseSchema, paginationSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  try {
    // 1. ALWAYS authenticate first (throws UnauthorizedError if not logged in)
    const session = await requireAuth()
    // Or for role-based access: await requireRole('ADMIN', 'LAWYER')
    
    const searchParams = request.nextUrl.searchParams

    // 2. Validate query parameters with safeParse() - NEVER use parse()
    const paginationResult = paginationSchema.safeParse({
      page: searchParams.get('page'),
      perPage: searchParams.get('perPage'),
    })

    if (!paginationResult.success) {
      return validationErrorResponse(paginationResult.error.format())
    }

    const { page, perPage } = paginationResult.data

    // 3. Query with explicit includes (NEVER use * or implicit includes)
    const total = await prisma.case.count()
    const cases = await prisma.case.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true, email: true } },
        lawyer: { select: { name: true } },
      },
    })

    // 4. Return with meta pagination (required for list endpoints)
    return successResponse(cases, {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    // 5. ALWAYS use handleApiError - it handles ApiError subclasses automatically
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
```

**Critical API Utilities** (see `apps/web/lib/api/`):
- **Custom Errors**: `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError` - throw these, handleApiError catches
- **Auth Helpers**: `requireAuth()` for any logged-in user, `requireRole('ADMIN', 'LAWYER')` for role checks
- **Response Helpers**: `successResponse()`, `validationErrorResponse()`, `notFoundResponse()`, `unauthorizedResponse()`

### Component Architecture
- **UI Components**: `components/ui/` - shadcn/ui-style with cva variants
- **Feature Components**: `components/{cases|clients|dashboard}/` - business logic
- **Layout Components**: `components/layout/` - auth/dashboard layouts
- **Route Groups**: `app/(auth)/` and `app/(dashboard)/` with nested layouts

### Database & Validation
- **Schema**: Single Prisma schema in `packages/database/prisma/schema.prisma`
- **Validation**: Zod schemas in `apps/web/lib/validations/schemas.ts` **MUST exactly match** Prisma models
- **Client**: PrismaClient singleton in `apps/web/lib/db.ts`, imported as `@/lib/db`
- **Package**: `packages/database` re-exports `@prisma/client` for workspace sharing
- **Bilingual Pattern**: All user-facing models use `_zh` and `_en` suffixes (e.g., `title_zh`, `title_en`, `description_zh`, `description_en`)
- **Multi-Tenancy**: Firm-based isolation via `firmId` foreign keys on User, Case, Invoice models

## 🎨 Design System - "Black Veil Empress"

**Complete Color Palette** (`apps/web/tailwind.config.ts`):
- **Blacks**: `premier-black` (#0a0a0a), `premier-black-light` (#1a1a1a)
- **Golds**: `premier-gold` (#D4AF37), `premier-gold-rose` (#B8860B), `premier-gold-champagne` (#F7E7CE)
- **Mystery Accents**: `premier-mystery-violet` (#4A148C), `premier-mystery-purple` (#6A1B9A), `premier-mystery-blue` (#1A237E)
- **Neutrals**: `premier-pearl` (#F5F5F5), `premier-pearl-gray` (#C0C0C0)

**Component Styling**:
- All UI components use `class-variance-authority` (cva) for variant management
- Glass morphism effects via `glass-card` class (backdrop-blur with opacity)
- Gradient backgrounds: `bg-premier-gold`, `bg-premier-mystery`, `bg-premier-dark`
- Custom shadows: `shadow-premier-xs` through `shadow-premier-glow-lg` with gold tints
- Border radius: `rounded-premier-sm` (8px) through `rounded-premier-2xl` (24px)
- Typography: Inter/Noto Sans TC (sans), Playfair Display/Noto Serif TC (serif), JetBrains Mono (mono)

**Example Component Pattern**:
```typescript
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'premier-base-styles',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-premier-gold to-premier-gold-rose',
        secondary: 'glass-card border border-premier-gold/30',
        mystery: 'bg-gradient-to-r from-premier-mystery-violet to-premier-mystery-purple',
      },
    },
  }
)
```

## 🌐 Internationalization (i18n)

**Framework**: next-intl with App Router integration

**Locale Strategy**:
- **Supported locales**: `zh` (Traditional Chinese), `en` (English)
- **Default locale**: `zh` (Traditional Chinese)
- **URL pattern**: `/[locale]/path` (locale prefix always present)
- **Messages**: JSON files in `apps/web/messages/` (`zh.json`, `en.json`)

**Combined Middleware** (`apps/web/middleware.ts`):
- Handles both i18n routing (next-intl) and authentication (NextAuth.js v5)
- i18n middleware runs first, prepends locale to all routes
- Auth middleware protects `/[locale]/dashboard/*` and API routes (except `/api/auth/*`, `/api/health`, `/api/public-cases`, `/api/translate`)
- Public paths: `/`, `/login`, `/register`, `/case-search`, `/landing`

**Usage in Components**:
```typescript
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('namespace')
  return <h1>{t('key')}</h1>
}
```

**Server Components**:
```typescript
import { getTranslations } from 'next-intl/server'

async function ServerComponent({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'namespace' })
  return <h1>{t('key')}</h1>
}
```

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

**Bilingual Data Handling**:
- All models with user-facing content require both `_zh` (Traditional Chinese) and `_en` (English) fields
- Validation schemas enforce either both fields or neither (never just one)
- Examples: `Case.title_zh`/`title_en`, `CaseNote.content_zh`/`content_en`, `PublicCase.title_zh`/`title_en`

**Activity Logging** (Audit Trail):
- POST/PUT/DELETE operations log to `prisma.activity.create()`
- Required fields: `action` (string), `userId`, `firmId`
- Optional: `entityType`, `entityId`, `metadata` (JSON)

## 🚨 Mandatory Pre-Change Analysis

Before ANY modification:
- **Impact Assessment**: Analyze cross-component dependencies 
- **Chain Reactions**: Database changes require this exact sequence:
  1. Update `packages/database/prisma/schema.prisma`
  2. Run `pnpm --filter=@looper-hq/database prisma generate`
  3. Run `pnpm db:push` (dev) or `pnpm db:migrate` (prod)
  4. Update Zod schemas in `apps/web/lib/validations/schemas.ts` to match
  5. Update API routes (`apps/web/app/api/**/route.ts`)
  6. Update UI components that consume the data
- **Validation Sync**: Keep Zod schemas aligned with Prisma models - enums, optionality, defaults MUST match exactly
- **Route Groups**: Respect `(auth)` vs `(dashboard)` boundaries - auth routes redirect to dashboard, dashboard routes require authentication
- **Bilingual Fields**: When adding user-facing text fields, ALWAYS add both `_zh` and `_en` versions

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

## 🔍 Non-Obvious Patterns & Gotchas

**Prisma Client Generation**:
- `postinstall` script in root `package.json` automatically runs `prisma generate` after `pnpm install`
- If you see "Prisma Client not found", you forgot to run `prisma generate` after schema changes
- Generation happens in `packages/database` but is consumed by apps via workspace imports

**API Response Format is Mandatory**:
```typescript
// Every successful response MUST use this shape
{ success: true, data: {...}, meta?: {...} }

// Every error response MUST use this shape  
{ success: false, error: { message: string, code?: string, details?: any } }
```

**Zod safeParse() Over parse()**:
- ALWAYS use `safeParse()` in API routes (returns `{ success: boolean, data?, error? }`)
- NEVER use `parse()` directly - it throws exceptions that aren't caught by handleApiError

**Multi-Tenant Isolation**:
- Firm model acts as tenant boundary
- When querying, ALWAYS filter by `firmId` if multi-tenant
- User.firmId links users to their tenant/law office

**Role-Based Access Control**:
- `ADMIN`: Full access to everything
- `LAWYER`: Full CRUD on cases, clients, documents, invoices
- `STAFF`: Read-only access
- `CLIENT`: Own resources only (`:own` suffix permissions)
- Use `requireRole('ADMIN', 'LAWYER')` to allow multiple roles
- Use `hasPermission(session, 'case:delete')` for granular checks

**Crawler System** (Public Cases):
- Daily automated tracking via GitHub Actions (2am HKT)
- Crawlers: HK Judiciary (placeholder), RSS feeds (SCMP, RTHK)
- Deduplication via unique constraint on `(source, externalId)`
- Run manually: `pnpm crawler:all` or `pnpm crawler:rss`

## 🚨 Environment Setup Requirements

**Required Environment Variables** (see `.env.example`):
```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/looper_hq"

# NextAuth (REQUIRED for authentication)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3005"

# Keycloak OAuth (OPTIONAL - credentials provider works without it)
KEYCLOAK_CLIENT_ID="looper-hq-web"
KEYCLOAK_ISSUER="http://localhost:8080/realms/looper-hq"

# OpenAI (OPTIONAL - for AI features)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5.1"
OPENAI_BASE_URL="https://openrouter.ai/api/v1"  # OpenRouter proxy support

# Crawler Configuration (OPTIONAL)
CRAWLER_ENABLED="true"
CRAWLER_SCHEDULE="0 18 * * *"  # Daily at 2am HKT (18:00 UTC)
RSS_TIMEOUT="30000"
RSS_MAX_RETRIES="3"
```

**Docker Services** (`infrastructure/docker/docker-compose.yml`):
- **PostgreSQL 16**: Port 5433, user: postgres, pass: postgres, db: looper_hq
- **Redis 7**: Port 6380 (no password by default)
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
- **Port conflict (5433)**: Check if another PostgreSQL is running

**Authentication Issues**:
- **Keycloak not required**: App works with credentials provider (email/password)
- **Session errors**: Verify `NEXTAUTH_SECRET` is set in `.env`
- **Redirect loops**: Check `NEXTAUTH_URL` matches your dev server port (web: 3005, legal: 3001)

## 🚫 Prohibited Actions
- Breaking existing API contracts without migration plan
- Simplifying features to reduce complexity without explicit approval  
- Ignoring the Premier Design System color/component patterns
- Direct database modifications bypassing Prisma
- Mixing authentication contexts between route groups
- Modifying `pnpm-lock.yaml` manually (always use `pnpm install`)
- Running `prisma db push` in production (use `prisma migrate` instead)
- Using `parse()` instead of `safeParse()` in Zod validation
- Creating API routes without authentication checks
- Adding text fields without bilingual (`_zh`/`_en`) support
- Skipping `prisma generate` after schema changes
