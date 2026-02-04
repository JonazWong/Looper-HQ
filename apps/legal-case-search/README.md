# Legal Case Search

> **Hong Kong Legal Case Management Platform**

## Overview

Legal Case Search is a comprehensive legal case management system integrated into the Looper HQ monorepo. It provides case management, client portal, time tracking, document management, and invoicing features for Hong Kong legal professionals.

## Features

- ✅ **Case Management** - Manage legal cases with full lifecycle tracking
- ✅ **Client Management** - Client portal and communication system
- ✅ **Time Tracking & Billing** - Track billable hours and generate invoices
- ✅ **Document Management** - Upload and organize case documents
- ✅ **Invoice System** - Generate and manage invoices
- ✅ **Multi-language Support** - English and Traditional Chinese
- ✅ **Subscription Tiers** - STARTER, PROFESSIONAL, ENTERPRISE, CUSTOM

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 19, TailwindCSS (Premier Design System)
- **Database**: Shared PostgreSQL via `@looper-hq/database`
- **Authentication**: NextAuth.js with Keycloak
- **Validation**: Zod schemas
- **State Management**: React Query

## Quick Start

```bash
# From monorepo root
pnpm install

# Start legal-case-search app
pnpm dev:legal

# Or run both apps simultaneously
pnpm dev:all
```

The app will be available at http://localhost:3001

## Directory Structure

```
apps/legal-case-search/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Main application pages
│   │   ├── cases/        # Case management
│   │   ├── clients/      # Client management
│   │   ├── time/         # Time tracking
│   │   ├── documents/    # Document management
│   │   └── invoices/     # Invoicing
│   ├── api/              # API routes
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── ui/               # Shared UI components
│   └── features/         # Feature-specific components
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── db.ts             # Database client
│   └── validations.ts    # Zod schemas
└── types/                # TypeScript types
```

## Database Models

The app uses the following shared database models:

- `Firm` - Law firms/offices
- `User` - Users with firm association
- `LegalClient` - Client information
- `Case` - Legal cases
- `TimeEntry` - Billable time tracking
- `LegalDocument` - Case documents
- `Invoice` - Billing and invoices
- `Message` - Client communications

## Authentication

Uses Keycloak for unified SSO:

```typescript
// Keycloak client configuration
{
  clientId: "legal-case-search",
  realm: "looper-hq",
  redirectUris: ["http://localhost:3001/*"]
}
```

### Role Mapping

- `ADMIN` - Firm owners
- `LAWYER` - Law firm staff
- `CLIENT` - Clients with limited access

## Development

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter=@looper-hq/database prisma generate

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev:legal
```

## Environment Variables

Create `.env.local` in the app directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-here"
KEYCLOAK_CLIENT_ID="legal-case-search"
KEYCLOAK_CLIENT_SECRET="your-client-secret"
KEYCLOAK_ISSUER="http://localhost:8080/realms/looper-hq"
```

## Shared Packages

This app uses the following workspace packages:

- `@looper-hq/database` - Shared Prisma database
- `@looper-hq/types` - Shared TypeScript types
- `@looper-hq/utils` - Shared utilities

## License

MIT
