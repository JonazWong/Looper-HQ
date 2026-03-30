# HK-Legal-Case-Agency Integration

This document describes the integration of HK-Legal-Case-Agency into the Looper HQ monorepo.

## Overview

The HK-Legal-Case-Agency application has been integrated as a new application called `legal-case-search` within the Looper HQ monorepo. This integration provides a unified legal case management platform for Hong Kong legal professionals.

## Architecture Changes

### 1. Database Schema Extensions

The shared Prisma schema (`packages/database/prisma/schema.prisma`) has been extended with the following models:

#### New Models
- `Firm` - Law firm/office management
- `LegalClient` - Legal client information (separate from general Client)
- `TimeEntry` - Billable time tracking
- `LegalDocument` - Case document management
- `Message` - Client communication system

#### Extended Models
- `User` - Added `firmId`, `firmOwner` fields for law firm association
- `Case` - Added `firmId`, `budget`, `deadline` fields
- `Invoice` - Added `firmId` and `timeEntries` relationship

#### New Enums
- `SubscriptionTier` - STARTER, PROFESSIONAL, ENTERPRISE, CUSTOM
- Extended `CaseStatus` - Added DRAFT, OPEN, IN_PROGRESS states

### 2. Application Structure

```
apps/legal-case-search/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Main application
│   ├── api/                 # API routes
│   │   └── auth/           # NextAuth endpoints
│   ├── globals.css         # Global styles with Premier Design System
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/
│   ├── ui/                 # Shared UI components
│   └── features/           # Feature-specific components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Database client
│   ├── utils.ts            # Utility functions
│   └── validations.ts      # Zod schemas
├── types/
│   └── next-auth.d.ts      # NextAuth type extensions
├── package.json            # Dependencies
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # TailwindCSS with Premier Design
└── tsconfig.json           # TypeScript configuration
```

### 3. Shared Packages

The application uses the following workspace packages:

- `@looper-hq/database` - Shared Prisma database with extended schema
- `@looper-hq/types` - Shared TypeScript types
- `@looper-hq/utils` - Shared utility functions
- `@looper-hq/config` - Shared configurations

### 4. Authentication Integration

#### Keycloak Configuration

A new Keycloak client has been configured in the `looper-hq` realm:

```json
{
  "clientId": "legal-case-search",
  "redirectUris": ["http://localhost:3001/*"],
  "webOrigins": ["http://localhost:3001"]
}
```

#### NextAuth.js Setup

- Provider: Keycloak
- Strategy: Database sessions
- Adapter: PrismaAdapter for user management
- Session callbacks: Include role, firmId, and firmOwner

#### Role Mapping

| Legacy Role | Keycloak Role | User.role |
|-------------|---------------|-----------|
| Firm Owner  | admin         | ADMIN     |
| Staff       | lawyer        | LAWYER    |
| Client      | client        | CLIENT    |

### 5. Development Workflow

#### Running Applications

```bash
# Start both applications
pnpm dev:all

# Start legal-case-search only
pnpm dev:legal

# Start main web app only
pnpm dev:web
```

#### Database Management

```bash
# Generate Prisma client
pnpm --filter=@looper-hq/database prisma generate

# Push schema changes
pnpm db:push

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

#### Docker Services

```bash
# Start all services (PostgreSQL, Redis, Keycloak, pgAdmin)
pnpm docker:up

# Stop all services
pnpm docker:down
```

## Features Integrated

### Core Features ✅

1. **Case Management**
   - Create, update, and track legal cases
   - Status workflow (Draft → Open → In Progress → Completed/Closed)
   - Priority levels (Low, Medium, High, Urgent)
   - Categories (Civil, Criminal, Corporate, Family, Property, Employment, etc.)

2. **Client Management**
   - LegalClient model for client information
   - Client portal access
   - Message system for client communication

3. **Time Tracking & Billing**
   - TimeEntry model for billable hours
   - Hourly rate tracking
   - Billable/non-billable flag
   - Integration with invoicing

4. **Document Management**
   - LegalDocument model for case files
   - File upload and organization
   - Document type categorization

5. **Invoice System**
   - Invoice generation from time entries
   - Status tracking (Draft, Pending, Paid, Overdue, Cancelled)
   - Firm-level invoicing

6. **Firm Management**
   - Multi-firm support
   - Subscription tiers
   - User-firm associations

### Design System

**Premier "Black Veil Empress" Theme**:
- Premier Black backgrounds (#0a0a0a)
- Luxury Gold accents (#D4AF37)
- Mystery Purple highlights
- Glass morphism effects
- Gradient text styles

## Environment Variables

### Legal Case Search App

Create `.env.local` in `apps/legal-case-search/`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/looper_hq"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-here"
KEYCLOAK_CLIENT_ID="legal-case-search"
KEYCLOAK_CLIENT_SECRET="your-client-secret-here"
KEYCLOAK_ISSUER="http://localhost:8080/realms/looper-hq"
```

### Root .env

Updated to include:

```env
# Legal Case Search Keycloak Client
LEGAL_CASE_SEARCH_CLIENT_ID=legal-case-search
LEGAL_CASE_SEARCH_CLIENT_SECRET=your-legal-case-client-secret-here
LEGAL_CASE_NEXTAUTH_URL="http://localhost:3001"

# Application Ports
WEB_APP_PORT=3000
LEGAL_CASE_SEARCH_PORT=3001
```

## Migration Checklist

- [x] Extend Prisma schema with legal case models
- [x] Create `apps/legal-case-search/` structure
- [x] Configure Next.js 15 with App Router
- [x] Set up TailwindCSS with Premier Design System
- [x] Configure Keycloak client
- [x] Set up NextAuth.js authentication
- [x] Create validation schemas with Zod
- [x] Update root package.json scripts
- [x] Update environment variables
- [x] Update README documentation
- [ ] Implement Case Management API routes
- [ ] Implement Client Management API routes
- [ ] Implement Time Tracking features
- [ ] Implement Document Management
- [ ] Implement Invoice system
- [ ] Add multi-language support (i18n)
- [ ] Create UI components
- [ ] Add comprehensive tests
- [ ] Deploy and verify SSO between apps

## Next Steps

1. **API Development**: Implement RESTful API routes for all core features
2. **UI Components**: Build React components using the Premier Design System
3. **Dashboard Pages**: Create dashboard layouts for cases, clients, time tracking, etc.
4. **Multi-language**: Integrate next-intl for English and Traditional Chinese
5. **Testing**: Add unit tests and integration tests
6. **Documentation**: Complete API documentation and user guides

## Resources

- [Looper HQ Repository](https://github.com/JonazWong/Looper-HQ)
- [Legal Case Search README](../../apps/legal-case-search/README.md)
- [Prisma Schema](../../packages/database/prisma/schema.prisma)
- [Keycloak Documentation](https://www.keycloak.org/docs/latest/securing_apps/)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## Support

For questions or issues, please open an issue in the GitHub repository or contact the project maintainers.
