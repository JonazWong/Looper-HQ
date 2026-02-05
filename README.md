# 🔄 Looper HQ

> **Unified Legal Case Management & Inquiry Platform for Hong Kong**

## 🌟 Features

### Main Application (Web)
- Case Management
- Client Portal
- Time Tracking & Billing
- Document Management
- **Public Case Search** - Search internal public cases
- **Public Cases** - Hong Kong legal case tracking & RSS news aggregation
- Multi-tenancy Support
- OAuth/OIDC Authentication
- **Daily Case Tracking** - Automated crawler for HK legal news

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

# Crawlers
pnpm crawler:all      # Run all crawlers (HK Judiciary + RSS)
pnpm crawler:judiciary # Run HK Judiciary crawler only
pnpm crawler:rss      # Run RSS news crawler only
```

## 📰 Public Case Tracking

The system automatically tracks and aggregates legal cases from multiple sources:

### Data Sources

1. **Hong Kong Judiciary** - Official court judgments (placeholder for future implementation)
2. **South China Morning Post (SCMP)** - Legal news via RSS
3. **RTHK (香港電台)** - Legal news via RSS
4. **HKLII** - Hong Kong Legal Information Institute (planned)

### Features

- **Automated Daily Tracking** - GitHub Actions runs at 2am HKT daily
- **Keyword Filtering** - Smart filtering for legal-related content
- **Deduplication** - Prevents duplicate entries via unique source + externalId
- **Search & Filtering** - Full-text search with source, category, and court filters
- **Multi-language** - Supports both English and Traditional Chinese

### Manual Execution

```bash
# Run all crawlers
pnpm crawler:all

# Run specific crawler
pnpm crawler:rss

# View results
pnpm db:studio
# Navigate to PublicCase table
```

### Accessing Public Cases

1. Web UI: Navigate to `/public-cases` in the dashboard
2. API: `GET /api/public-cases?query=&source=&category=&court=&page=1&limit=20`

### Configuration

See `.env.example` for crawler configuration:
- `CRAWLER_ENABLED` - Enable/disable crawlers
- `RSS_TIMEOUT` - RSS feed fetch timeout
- `RSS_MAX_RETRIES` - Maximum retry attempts
- `RSS_USER_AGENT` - User agent for crawler requests

For more details, see:
- [香港法律案件搜尋器與自動追蹤系統](docs/香港法律案件搜尋器與自動追蹤系統.md)
- [RSS Implementation Status](docs/RSS_IMPLEMENTATION_STATUS.md)
- [Engineer Task Breakdown](docs/HK%20Legal%20Case%20Agency工程師任務分解與實現指南.md)

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Quick Start](docs/QUICKSTART.md)
- [Migration Guide](docs/migration/README.md)
- [Legal Case Search](apps/legal-case-search/README.md)
- [**HK Legal Case Agency Integration**](docs/香港法律案件搜尋器與自動追蹤系統.md)
- [**RSS Implementation Status**](docs/RSS_IMPLEMENTATION_STATUS.md)

## 📄 License

MIT License