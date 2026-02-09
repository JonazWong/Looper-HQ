# 🏛️ Looper HQ Nexus-L

> **AI-Powered Legal Case Database & Intelligent Search Platform for Hong Kong**  
> Professional legal case management with comprehensive database and advanced search algorithms

[![Deploy to DigitalOcean](https://img.shields.io/badge/Deploy-DigitalOcean-0080FF?logo=digitalocean)](https://cloud.digitalocean.com/apps)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)](https://nextjs.org/)

## 🌟 Platform Architecture

### Nexus Legal (Core Functions)
**Primary Legal Case Management System**
- 💼 **Cases Management** - Comprehensive case lifecycle management
- 👥 **Clients Management** - Client records & communication portal
- 🔍 **Smart Search** - Intelligent case & document search
- 📊 **Analytics Dashboard** - Real-time insights & reporting

### Looper HQ (Supporting Infrastructure)
**Enterprise Platform Features**
- 📄 **Document Management** - Secure file storage & version control
- 📅 **Calendar** - Court dates & deadline tracking
- ⏱️ **Time Tracking** - Billable hours management
- 💰 **Billing** - Invoice generation & management
- 🔐 **Auth** - OAuth/OIDC authentication
- 🏢 **Multi-Tenancy** - Firm-based data isolation

## 🚀 Quick Start

### Local Development

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

### Production Deployment

**Quick Deploy to DigitalOcean (15 minutes):**

```bash
# 1. Push to GitHub
git push origin main

# 2. Create App on DigitalOcean
# Visit: https://cloud.digitalocean.com/apps
# Connect GitHub repo: JonazWong/Looper-HQ
# App Platform auto-reads .do/app.yaml

# 3. Set environment variables (see .env.production.example)
# Required: NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL
# Optional: OPENAI_API_KEY, KEYCLOAK_CLIENT_ID, SLACK_WEBHOOK

# 4. Deploy!
```

📖 **Deployment Guides:**
- [Quick Start](./docs/deployment/quickstart.md) - 5-minute deployment guide
- [Digital Ocean Setup](./docs/deployment/digitalocean.md) - Complete DO implementation
- [Full Deployment Guide](./docs/deployment/README.md) - Comprehensive deployment documentation

### Migrating from HK-Legal-Case-Agency

If you're upgrading from the previous version:
- 📖 [Migration Guide](./docs/deployment/migrate-from-agency.md) - Complete step-by-step migration instructions
- 🔐 [Environment Variables](./docs/deployment/environment-variables.md) - Required configuration reference
- ⚡ [Quick Reference](./docs/deployment/QUICK_REFERENCE.md) - Common deployment tasks
- ✅ Run pre-migration check: `pnpm pre-migration-check`

### 🔄 CI/CD Pipeline

Automated deployment pipeline with GitHub Actions:

- ✅ **Test Stage**: Type-check, lint, unit tests
- ✅ **Build Stage**: Production build with artifacts
- ✅ **Deploy Stage**: Automated Digital Ocean deployment
- ✅ **Health Checks**: Automated verification after deployment
- ✅ **Notifications**: Slack alerts for deployment status

Workflow triggers on push to `main` or `production` branches.

### 🏥 Health Monitoring

Real-time system health monitoring at `/api/health`:

- **Database**: Connectivity and response time (<1000ms)
- **OpenAI/OpenRouter**: API configuration validation
- **Memory**: Usage monitoring (warns at >90%)
- **Status Levels**: healthy (200) | degraded (200) | unhealthy (503)

### 🔧 Self-Healing System

Automated repair for common issues:

- Database connection recovery
- Stale connection cleanup (>1hr idle)
- Runs every 5 minutes automatically
- Manual execution: `tsx scripts/auto-repair.ts`

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

- [Documentation Index](./docs/README.md) - Complete documentation guide
- [Architecture](./docs/ARCHITECTURE.md) - System architecture
- [Quick Start](./docs/QUICKSTART.md) - Development quick start
- [Deployment Guide](./docs/deployment/README.md) - Production deployment
- [Testing Guide](./docs/guides/testing.md) - Testing infrastructure
- [Demo Guide](./docs/guides/demo-guide.md) - Product demonstration
- [Migration Guide](./docs/migration/README.md) - Database migrations

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

## 🔧 Maintenance Notes

### RSS Crawler (Currently Disabled)

⚠️ **The automated RSS news crawler is currently disabled** due to source failures.

See [docs/archive/rss-crawler-disabled.md](./docs/archive/rss-crawler-disabled.md) for details.

To re-enable, update `.github/workflows/rss-crawler.yml` with working RSS sources.

---

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

## 📄 License

MIT License