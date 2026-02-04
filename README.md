# 🔄 Looper HQ

> **Unified Legal Case Management & Inquiry Platform for Hong Kong**

## 🌟 Features

### Main Application (Web)
- Case Management
- Client Portal
- Time Tracking & Billing
- Document Management
- Public Case Search
- Multi-tenancy Support
- OAuth/OIDC Authentication

### Legal Case Search Application
- Comprehensive Case Management System
- Client Management with Communication Portal
- Time Tracking & Billing
- Document Management System
- Invoice Generation & Management
- Multi-language Support (EN/繁中)
- Subscription Tiers (Starter, Professional, Enterprise, Custom)

## 🚀 Quick Start

```bash
git clone https://github.com/JonazWong/Looper-HQ.git
cd Looper-HQ
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:push
pnpm db:seed

# Run both applications
pnpm dev:all

# Or run individually
pnpm dev:web    # Main app on http://localhost:3000
pnpm dev:legal  # Legal case search on http://localhost:3001
```

## 📦 Structure

```
looper-hq/
├── apps/
│   ├── web/                    # Main Next.js web application (port 3000)
│   └── legal-case-search/      # Legal case management app (port 3001)
├── services/                   # Microservices
├── packages/
│   ├── database/               # Shared Prisma database
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── config/                 # Shared configurations
├── infrastructure/
│   ├── docker/                 # Docker Compose configs
│   └── keycloak/              # Keycloak realm configurations
└── docs/                       # Documentation
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Node.js, Spring Boot 3, Flask
- **Database**: PostgreSQL, Prisma ORM
- **Cache**: Redis
- **Auth**: Keycloak, NextAuth.js
- **DevOps**: Docker, Turborepo, pnpm

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Quick Start](docs/QUICKSTART.md)
- [Migration Guide](docs/migration/README.md)
- [Legal Case Search](apps/legal-case-search/README.md)

## 🔧 Development Scripts

```bash
# Development
pnpm dev              # Run all apps
pnpm dev:web          # Run main web app only
pnpm dev:legal        # Run legal case search only
pnpm dev:all          # Run both apps in parallel

# Database
pnpm db:migrate       # Run database migrations
pnpm db:push          # Push schema changes
pnpm db:seed          # Seed database with test data
pnpm db:studio        # Open Prisma Studio

# Docker
pnpm docker:up        # Start all services
pnpm docker:down      # Stop all services

# Build & Test
pnpm build            # Build all apps
pnpm test             # Run tests
pnpm lint             # Run linters
```

## 📄 License

MIT License