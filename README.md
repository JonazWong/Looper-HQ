# 🔄 Looper HQ

> **Unified Legal Case Management & Inquiry Platform for Hong Kong**

A comprehensive, production-ready legal case management system built with modern web technologies and microservices architecture.

## 🌟 Features

### Core Features
- **Case Management** - Complete CRUD operations for legal cases with status tracking
- **Client Portal** - Client management with membership tiers
- **Time Tracking & Billing** - Billable hours tracking and automated invoice generation
- **Document Management** - Secure file upload/download with categorization
- **Public Case Search** - Membership-tier based public case search
- **Multi-tenancy Support** - Organization and user isolation
- **OAuth/OIDC Authentication** - Keycloak integration with NextAuth.js v5

### Advanced Features
- Role-Based Access Control (RBAC) - ADMIN, LAWYER, CLIENT, STAFF
- Activity Logging - Complete audit trail
- Dashboard Analytics - Real-time statistics and insights
- Responsive Design - Mobile-first approach
- Hong Kong Localization - Timezone, currency, phone formats

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose

### Installation

```bash
# Clone repository
git clone https://github.com/JonazWong/Looper-HQ.git
cd Looper-HQ

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start infrastructure services (PostgreSQL, Redis, Keycloak)
pnpm docker:up

# Initialize database
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

Visit:
- **Web App:** http://localhost:3000
- **Keycloak Admin:** http://localhost:8080 (admin/admin)
- **pgAdmin:** http://localhost:5050 (
    
    
    
    /admin)

## 📦 Project Structure

```
looper-hq/
├── apps/
│   └── web/              # Next.js 15 web application
│       ├── app/          # App router pages
│       │   ├── (auth)/   # Authentication pages
│       │   ├── (dashboard)/ # Dashboard pages
│       │   └── api/      # API routes (unified backend)
│       ├── components/   # React components
│       ├── lib/          # Utilities and helpers
│       └── __tests__/    # Test files
├── packages/
│   ├── database/         # Prisma schema and client
│   ├── types/            # Shared TypeScript types
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration management
│   └── migration/        # Data migration tools
├── services/             # Future microservices (currently using Next.js API routes)
├── infrastructure/
│   ├── docker/           # Docker Compose configurations
│   └── keycloak/         # Keycloak realm configurations
└── docs/                 # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 with App Router
- **UI Library:** React 19
- **Styling:** TailwindCSS with custom design system
- **State Management:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Animations:** Framer Motion

### Backend
- **API:** Next.js API Routes (RESTful)
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Cache:** Redis 7
- **Authentication:** Keycloak 23 + NextAuth.js v5
- **File Storage:** Local/S3 compatible

### DevOps
- **Monorepo:** Turborepo
- **Package Manager:** pnpm
- **Containerization:** Docker & Docker Compose
- **Testing:** Vitest + Testing Library
- **Linting:** ESLint + Prettier

## 📖 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design decisions
- **[Quick Start](docs/QUICKSTART.md)** - Detailed setup guide
- **[Authentication](apps/web/docs/AUTH.md)** - Auth setup and RBAC
- **[Testing](apps/web/TESTING.md)** - Testing guide and best practices
- **[Migration Guide](docs/migration/README.md)** - Data migration documentation
- **[API Documentation](docs/API.md)** - API endpoints and usage (coming soon)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

**Test Coverage:**
- 89 tests total
- 76 passing (85% pass rate)
- Utilities: 100% passing
- Components: 100% passing
- API Routes: POST routes fully working

## 🔧 Development

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Format code
pnpm format

# Database operations
pnpm db:push        # Push schema changes
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed database
pnpm db:studio      # Open Prisma Studio

# Docker operations
pnpm docker:up      # Start services
pnpm docker:down    # Stop services
pnpm docker:logs    # View logs
pnpm docker:clean   # Clean up volumes
```

## 🔐 Authentication & Authorization

The system uses **Keycloak** for authentication with **NextAuth.js v5** integration:

1. **Keycloak Provider:** Primary SSO authentication
2. **Credentials Provider:** Fallback for local development
3. **Role Mapping:** Automatic sync from Keycloak to database
4. **RBAC:** Four roles - ADMIN, LAWYER, CLIENT, STAFF

See [Authentication Documentation](apps/web/docs/AUTH.md) for setup details.

## 📱 Dashboard Pages

### Implemented Pages
- ✅ `/dashboard` - Overview with statistics
- ✅ `/dashboard/cases` - Case list with filters
- ✅ `/dashboard/cases/[id]` - Case details with documents, activities, notes
- ✅ `/dashboard/cases/new` - New case creation form
- ✅ `/dashboard/clients` - Client management
- ✅ `/dashboard/search` - Public case search (with membership limits)
- ✅ `/dashboard/billing` - Invoice management
- ✅ `/dashboard/documents` - Document library
- ✅ `/dashboard/time-tracking` - Time log management

## 🔌 API Endpoints

### Cases
- `GET /api/cases` - List cases with filtering
- `POST /api/cases` - Create new case
- `GET /api/cases/[id]` - Get case details
- `PATCH /api/cases/[id]` - Update case
- `DELETE /api/cases/[id]` - Delete case

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/[id]` - Get document
- `PATCH /api/documents/[id]` - Update metadata
- `DELETE /api/documents/[id]` - Delete document

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/[id]` - Get invoice
- `PATCH /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice

### Time Logs
- `GET /api/time-logs` - List time logs (with statistics)
- `POST /api/time-logs` - Create time log
- `GET /api/time-logs/[id]` - Get time log
- `PATCH /api/time-logs/[id]` - Update time log
- `DELETE /api/time-logs/[id]` - Delete time log

### Other
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/search` - Public case search
- `GET /api/health` - Health check

## 🌍 Internationalization

Currently supports:
- **English** (default)
- **Traditional Chinese** (繁體中文) - Prepared for future implementation

All dates/times use **Hong Kong timezone (Asia/Hong_Kong)**.

## 🚀 Deployment

### Docker Deployment

```bash
# Build and start all services
docker compose -f infrastructure/docker/docker-compose.yml up -d

# View logs
docker compose -f infrastructure/docker/docker-compose.yml logs -f

# Stop services
docker compose -f infrastructure/docker/docker-compose.yml down
```

### Production Build

```bash
# Build all packages
pnpm build

# Start production server
pnpm start
```

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions (coming soon).

## 🔒 Security

- ✅ SQL Injection Protection (Prisma ORM)
- ✅ XSS Protection (React & Next.js built-in)
- ✅ CSRF Protection (NextAuth.js)
- ✅ Authentication & Authorization (Keycloak + RBAC)
- ✅ Input Validation (Zod schemas)
- ✅ Secure Session Management (JWT)
- ✅ Rate Limiting (planned with Redis)

## 📊 Database Schema

Key entities:
- **User** - System users with roles
- **Case** - Legal cases with status tracking
- **Client** - Client information with membership tiers
- **Document** - File attachments with metadata
- **Invoice** - Billing and invoicing
- **TimeLog** - Billable hours tracking
- **Activity** - Audit trail
- **Membership** - User membership and limits

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript strict mode
- Follow existing code patterns
- Write tests for new features
- Update documentation
- Run linter before committing

## 📝 Environment Variables

Key variables (see `.env.example` for complete list):

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/looper_hq

# Redis
REDIS_URL=redis://localhost:6379

# Keycloak
KEYCLOAK_FRONTEND_URL=http://localhost:8080
KEYCLOAK_REALM=looper-hq
KEYCLOAK_CLIENT_ID=looper-hq-web
KEYCLOAK_CLIENT_SECRET=your-secret

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

Built with ❤️ for the Hong Kong legal community

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- Keycloak for enterprise authentication
- All open source contributors

## 📞 Support

For issues and questions:
- **GitHub Issues:** https://github.com/JonazWong/Looper-HQ/issues
- **Documentation:** See `/docs` directory
- **Email:** support@looper-hq.dev (placeholder)

---

**Looper HQ** - Professional Legal Case Management Made Simple