# 🐳 Looper HQ - Docker Containerization

**Complete Docker containerization following best practices for the Looper HQ platform.**

## 📦 What You Get

✅ **Production-ready Docker configuration**  
✅ **Multi-stage optimized Dockerfiles** (84% size reduction)  
✅ **Complete orchestration** with Docker Compose  
✅ **Multiple environment support** (dev, test, production)  
✅ **Automated build scripts** (Windows & Unix)  
✅ **One-command setup** with quick-start scripts  
✅ **Comprehensive documentation**

## 🚀 Quick Start (30 seconds)

### Verify Setup
```bash
# Windows
scripts\docker-verify.bat

# Linux/macOS
./scripts/docker-verify.sh
```

### Option 1: Interactive Setup (Recommended)
```bash
# Windows
scripts\docker-quickstart.bat

# Linux/macOS  
./scripts/docker-quickstart.sh
```

### Option 2: Manual Commands
```bash
# Development (infrastructure only)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
pnpm install && pnpm db:migrate && pnpm dev

# Full stack
docker-compose up -d --build
```

### Option 3: Using Make (Linux/macOS)
```bash
make dev    # Infrastructure only
make up     # Full stack
make prod   # Production stack
```

## 📂 Files Overview

```
📁 Project Root
├── 🐳 Dockerfile                    # Multi-stage optimized Dockerfile
├── 📋 docker-compose.yml            # Base stack configuration
├── 🔧 docker-compose.dev.yml        # Development overrides
├── 🚀 docker-compose.prod.yml       # Production overrides
├── 🚫 .dockerignore                 # Build exclusions (optimized)
├── 🛠️  Makefile                      # Convenience commands
│
├── 📚 Documentation
│   ├── DOCKER.md                    # Detailed usage guide
│   ├── DOCKER_SETUP.md              # Complete setup guide
│   ├── DOCKERFILE_OPTIMIZATION.md   # Optimization details
│   └── README_DOCKER.md             # This file
│
└── 📜 scripts/
    ├── docker-build.sh              # Build script (Unix)
    ├── docker-build.bat             # Build script (Windows)
    ├── docker-quickstart.sh         # Quick start (Unix)
    ├── docker-quickstart.bat        # Quick start (Windows)
    ├── docker-verify.sh             # Verification (Unix)
    └── docker-verify.bat            # Verification (Windows)
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│          Looper HQ Platform                  │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────┐         ┌──────────┐          │
│  │   Web    │         │  Legal   │          │
│  │ (3005)   │         │  (3001)  │          │
│  └────┬─────┘         └────┬─────┘          │
│       │                    │                │
│       └────────┬───────────┘                │
│                ▼                            │
│       ┌────────────────┐                    │
│       │  PostgreSQL 16 │                    │
│       │    (5432)      │                    │
│       └────────────────┘                    │
│                ▼                            │
│       ┌────────────────┐                    │
│       │    Redis 7     │                    │
│       │    (6379)      │                    │
│       └────────────────┘                    │
│                ▼                            │
│       ┌────────────────┐                    │
│       │  Keycloak 23   │                    │
│       │    (8080)      │                    │
│       └────────────────┘                    │
│                                              │
└─────────────────────────────────────────────┘
```

## 📊 Image Sizes

| Image | Size | Description |
|-------|------|-------------|
| `looper-hq/web` | **317MB** | Main web application |
| `looper-hq/legal-case-search` | **308MB** | Legal search app |
| `postgres:16-alpine` | 238MB | PostgreSQL database |
| `redis:7-alpine` | 32MB | Redis cache |
| `keycloak:23` | 650MB | Authentication server |

**Total:** ~1.5GB for full stack

## 🎯 Use Cases

### 1️⃣ Local Development (Recommended)
**Run databases in Docker, apps locally**

```bash
# Start infrastructure
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Run locally
pnpm install
pnpm db:migrate  
pnpm dev
```

**Benefits:** Fast hot-reload, easy debugging, full IDE support

### 2️⃣ Full Stack Testing
**Everything in Docker**

```bash
# Build and start
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Benefits:** Production parity, isolated environment, easy cleanup

### 3️⃣ Production Deployment
**Optimized for production**

```bash
# Build with tag
./scripts/docker-build.sh --tag v1.0.0

# Start production stack
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale web=3
```

**Benefits:** Resource optimization, health checks, service replication

## 🔨 Build Commands

```bash
# Basic build
./scripts/docker-build.sh

# Build without cache
./scripts/docker-build.sh --no-cache

# Build with custom tag
./scripts/docker-build.sh --tag v1.0.0

# Build and push to registry
./scripts/docker-build.sh --tag v1.0.0 --push --registry ghcr.io/your-org
```

## 📋 Common Commands

### Service Management
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View status
docker-compose ps
```

### Logs & Debugging
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f web

# Last 100 lines
docker-compose logs --tail=100 web
```

### Database Operations
```bash
# Run migrations
docker-compose exec web pnpm db:migrate

# Seed database
docker-compose exec web pnpm db:seed

# PostgreSQL shell
docker-compose exec postgres psql -U postgres -d looper_hq

# Backup database
docker-compose exec postgres pg_dump -U postgres looper_hq > backup.sql
```

### Container Access
```bash
# Shell into web container
docker-compose exec web sh

# Shell into legal container
docker-compose exec legal sh

# Redis CLI
docker-compose exec redis redis-cli
```

## 🔒 Security Features

✅ Non-root users (nextjs:nodejs UID 1001)  
✅ Multi-stage builds (no build tools in production)  
✅ Minimal Alpine base images  
✅ Read-only configuration mounts  
✅ Network isolation  
✅ Health checks for all services  
✅ Resource limits defined  
✅ No secrets in images

## ⚡ Performance

### Build Cache Optimization
- Dependency layers cached separately
- Source code changes don't invalidate dependencies
- Turborepo handles monorepo builds efficiently

### Runtime Optimization
- Next.js standalone output (~80% smaller)
- Production builds with optimizations
- Optimized PostgreSQL settings
- Redis persistence configured

### Resource Usage

| Environment | RAM | CPU | Disk |
|-------------|-----|-----|------|
| Development (infra only) | ~1.5GB | 10-20% | ~2GB |
| Full Stack | ~4GB | 30-50% | ~4GB |
| Production (replicas) | ~8GB | 50-80% | ~5GB |

## 🐛 Troubleshooting

### Services won't start
```bash
docker-compose ps              # Check status
docker-compose logs            # View logs
docker system df               # Check resources
```

### Port conflicts
```bash
# Find process using port
lsof -i :3005                  # macOS/Linux
netstat -ano | findstr :3005   # Windows

# Change port in .env
WEB_APP_PORT=3006
```

### Build failures
```bash
docker builder prune           # Clean cache
docker system prune -af        # Clean everything
df -h                          # Check disk space
```

### Database connection issues
```bash
docker-compose ps postgres                    # Check status
docker-compose logs postgres                  # View logs
docker-compose exec postgres pg_isready       # Test connection
```

## 📚 Documentation

- **[DOCKER.md](./DOCKER.md)** - Detailed usage guide with examples
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Complete setup instructions  
- **[DOCKERFILE_OPTIMIZATION.md](./DOCKERFILE_OPTIMIZATION.md)** - Technical optimization details

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Critical settings
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
KEYCLOAK_CLIENT_SECRET="your-keycloak-secret"
OPENAI_API_KEY="your-api-key"
```

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| Web App | 3005 | http://localhost:3005 |
| Legal Search | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Keycloak | 8080 | http://localhost:8080 |
| pgAdmin | 5050 | http://localhost:5050 |

## 🤝 Contributing

When modifying Docker configuration:

1. Run verification: `./scripts/docker-verify.sh`
2. Test locally: `docker-compose up`
3. Build images: `./scripts/docker-build.sh`
4. Check sizes: `docker images looper-hq/*`
5. Update documentation

## 📞 Support

**Issues?**
1. Check this README
2. Review logs: `docker-compose logs`
3. Run verification: `scripts/docker-verify.bat`
4. Check [DOCKER_SETUP.md](./DOCKER_SETUP.md) troubleshooting section

**Need Help?**
- Check GitHub issues
- Review documentation files
- Verify Docker installation and resources

---

**Version:** 2.0.0  
**Last Updated:** 2026-02-16  
**Docker:** 29.1.3  
**Compose:** 5.0.1

**Status:** ✅ Production Ready
