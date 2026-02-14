# 🏛️ Looper HQ

> **AI-Powered Legal Case Database & Intelligent Search Platform for Hong Kong**  
> Professional legal case management with comprehensive database and advanced search algorithms

[![Deploy to DigitalOcean](https://img.shields.io/badge/Deploy-DigitalOcean-0080FF?logo=digitalocean)](https://cloud.digitalocean.com/apps)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)](https://nextjs.org/)

## 🌟 Platform Features

### Core Functions
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

**🚀 Deploy to Digital Ocean App Platform (Recommended):**

Complete deployment guide with CI/CD: **[docs/deployment-guide.md](./docs/deployment-guide.md)**

**Quick Setup (15 minutes):**

```bash
# 1. Create App on Digital Ocean
# Visit: https://cloud.digitalocean.com/apps
# Connect GitHub repo: JonazWong/Looper-HQ
# App Platform auto-reads .do/app.yaml

# 2. Set required secrets in DO Console
# - NEXTAUTH_SECRET (generate: openssl rand -base64 32)
# - OPENAI_API_KEY (from OpenRouter or OpenAI)

# 3. Configure GitHub Secrets for CI/CD
# - DIGITALOCEAN_ACCESS_TOKEN
# - DIGITALOCEAN_APP_ID

# 4. Push to main - automatic deployment!
git push origin main
```

📖 **Documentation:**
- **[Digital Ocean App Platform Guide](./docs/deployment-guide.md)** - Complete setup & CI/CD (Recommended)
- [Quick Start](./docs/deployment/quickstart.md) - Droplet deployment guide
- [Full Deployment Guide](./docs/deployment/README.md) - Comprehensive documentation

**Features:**
- ✅ Automatic deployments on push to `main`
- ✅ Zero-downtime rolling updates
- ✅ Automatic database migrations
- ✅ Managed PostgreSQL 16 database
- ✅ Built-in monitoring & logging
- ✅ SSL/TLS certificates (auto-managed)

### 🔄 CI/CD Pipeline

Automated deployment pipeline with GitHub Actions (`.github/workflows/deploy-production.yml`):

**Stages:**
- ✅ **Test & Build**: Dependencies, Prisma generation, type-check, lint, build
- ✅ **Deploy**: Update app spec, trigger DO App Platform deployment  
- ✅ **Verify**: Wait for deployment, health check validation (10 retries)

**Triggers:**
- Automatic: Push to `main` branch
- Manual: workflow_dispatch in GitHub Actions UI

**Deployment Process:**
1. Install dependencies with pnpm
2. Generate Prisma client
3. Build Next.js application
4. Run tests (continues on error)
5. Trigger Digital Ocean App Platform deployment via doctl
6. Wait for deployment to complete (15 min timeout)
7. Verify health endpoint returns 200
8. Display deployment summary with URLs

**Time:** ~10-15 minutes per deployment

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
- **Auth**: NextAuth.js v5 (with optional Keycloak OAuth provider)
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
pnpm db:push          # Sync schema to database (dev)
pnpm db:migrate       # Create and apply migrations
pnpm db:seed          # Seed database with sample data
pnpm db:studio        # Open Prisma Studio

# Crawlers (Public Case Tracking)
pnpm crawler:all      # Run all crawlers (HK Judiciary + RSS)
pnpm crawler:rss      # Run RSS news crawler only
pnpm crawler:judiciary # Run HK Judiciary crawler only
pnpm crawler:health   # Check crawler health status

# Docker
pnpm docker:up        # Start all services
pnpm docker:down      # Stop all services

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

📚 **爬蟲系統快速參考**: [CRAWLER_QUICK_REFERENCE.md](./CRAWLER_QUICK_REFERENCE.md)  
📖 **完整設置指南**: [docs/CRAWLER_SETUP_GUIDE.md](./docs/CRAWLER_SETUP_GUIDE.md)

---

## 📰 Public Case Tracking

The system automatically tracks and aggregates legal cases from multiple sources:

### Automated Crawlers ✅

| Crawler | Schedule | Status | Sources |
|---------|----------|--------|---------|
| **Daily Case Tracking** | Every day 2:00 AM HKT | ✅ Active | HK Judiciary + RSS News |
| **RSS News Crawler** | Every day 2:30 AM HKT | ✅ Active | Ming Pao, SCMP, RTHK |

### Data Sources

1. **Hong Kong Judiciary** - Official court judgments (placeholder for future implementation)
2. **Ming Pao (明報)** - Legal news via RSS
3. **South China Morning Post (SCMP)** - Legal news via RSS (planned)
4. **RTHK (香港電台)** - Legal news via RSS (planned)

### Features

- **Automated Daily Tracking** - GitHub Actions runs twice daily
- **Keyword Filtering** - Smart filtering for legal-related content (繁中/EN)
- **Deduplication** - Prevents duplicate entries via unique (source, externalId) constraint
- **Search & Filtering** - Full-text search with source, category, and court filters
- **Error Handling** - Automatic retry logic with exponential backoff
- **Health Monitoring** - Success rate tracking and error logging
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