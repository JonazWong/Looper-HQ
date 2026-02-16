# 🐳 Looper HQ - Docker Setup Guide

Complete guide for containerizing and running the Looper HQ platform with Docker.

## 📦 What's Included

This Docker setup provides:

✅ **Optimized Dockerfile** - Multi-stage builds for minimal production images  
✅ **Docker Compose** - Complete application stack orchestration  
✅ **Multiple Environments** - Dev, production, and testing configurations  
✅ **Build Scripts** - Automated build and deployment tools  
✅ **Quick Start** - One-command setup for rapid development  
✅ **Best Practices** - Security, performance, and maintainability

## 🚀 Quick Start

### Option 1: Interactive Quick Start (Recommended)

**Linux/macOS:**
```bash
./scripts/docker-quickstart.sh
```

**Windows:**
```cmd
scripts\docker-quickstart.bat
```

### Option 2: Using Make (Linux/macOS)

```bash
# Start development environment
make dev

# Start full stack
make up

# Start production stack
make prod
```

### Option 3: Manual Docker Compose

**Development (Infrastructure Only):**
```bash
# Start databases and services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Run apps locally
pnpm install
pnpm db:migrate
pnpm dev
```

**Full Stack:**
```bash
# Build and start all services
docker-compose up -d --build

# Access applications
# Web: http://localhost:3005
# Legal: http://localhost:3001
```

## 📋 Prerequisites

1. **Docker Desktop** (version 20.10+)
   - [Download for Windows](https://www.docker.com/products/docker-desktop/)
   - [Download for macOS](https://www.docker.com/products/docker-desktop/)
   - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)

2. **System Requirements**
   - RAM: 8GB minimum (16GB recommended)
   - Disk: 20GB free space
   - CPU: 4 cores recommended

3. **Tools** (for development mode)
   - Node.js 20+
   - pnpm 8+

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Looper HQ Platform                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐         ┌──────────────┐          │
│  │   Web App    │         │ Legal Search │          │
│  │  (Port 3005) │         │  (Port 3001) │          │
│  └──────┬───────┘         └──────┬───────┘          │
│         │                        │                  │
│         └────────────┬───────────┘                  │
│                      │                              │
│         ┌────────────▼────────────┐                 │
│         │      PostgreSQL 16       │                 │
│         │      (Port 5432)         │                 │
│         └──────────────────────────┘                 │
│                      │                              │
│         ┌────────────▼────────────┐                 │
│         │        Redis 7           │                 │
│         │      (Port 6379)         │                 │
│         └──────────────────────────┘                 │
│                      │                              │
│         ┌────────────▼────────────┐                 │
│         │      Keycloak 23         │                 │
│         │      (Port 8080)         │                 │
│         └──────────────────────────┘                 │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
.
├── Dockerfile                      # Multi-stage optimized Dockerfile
├── docker-compose.yml              # Base compose configuration
├── docker-compose.dev.yml          # Development overrides
├── docker-compose.prod.yml         # Production overrides
├── .dockerignore                   # Build context exclusions
├── Makefile                        # Convenience commands
├── DOCKER.md                       # Detailed documentation
├── DOCKER_SETUP.md                 # This file
└── scripts/
    ├── docker-build.sh             # Build script (Unix)
    ├── docker-build.bat            # Build script (Windows)
    ├── docker-quickstart.sh        # Quick start (Unix)
    └── docker-quickstart.bat       # Quick start (Windows)
```

## ⚙️ Configuration

### Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update critical values in `.env`:

   ```bash
   # Database
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"
   
   # NextAuth
   NEXTAUTH_SECRET="generate-a-random-secret-here"
   
   # Keycloak
   KEYCLOAK_CLIENT_SECRET="your-client-secret"
   
   # AI Provider
   OPENAI_API_KEY="your-openai-api-key"
   ```

3. Generate secrets:
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

## 🎯 Common Use Cases

### Use Case 1: Local Development

**Goal:** Run databases in Docker, apps locally for fast iteration

```bash
# 1. Start infrastructure
make dev
# OR: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 2. Install dependencies
pnpm install

# 3. Run migrations
pnpm db:migrate

# 4. Start dev servers
pnpm dev

# Web app: http://localhost:3005
# Legal search: http://localhost:3001
```

**Benefits:**
- Fast hot reload
- Easy debugging
- Full IDE integration
- Minimal resource usage

### Use Case 2: Full Stack Testing

**Goal:** Run everything in Docker to test production-like environment

```bash
# 1. Build images
make build
# OR: ./scripts/docker-build.sh

# 2. Start all services
make up
# OR: docker-compose up -d

# 3. Check status
make status
# OR: docker-compose ps

# 4. View logs
make logs
# OR: docker-compose logs -f
```

**Benefits:**
- Production parity
- Test full stack integration
- Isolated environment
- Easy cleanup

### Use Case 3: Production Deployment

**Goal:** Deploy to production with optimal settings

```bash
# 1. Build production images with tag
./scripts/docker-build.sh --tag v1.0.0

# 2. Push to registry (if needed)
./scripts/docker-build.sh --tag v1.0.0 --push --registry your-registry.com

# 3. Start production stack
make prod
# OR: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Monitor
make health
docker-compose logs -f
```

**Benefits:**
- Optimized resource usage
- Health checks enabled
- Proper logging
- Service replication

## 🔨 Build Process

### Manual Build

```bash
# Build all images
./scripts/docker-build.sh

# Build without cache
./scripts/docker-build.sh --no-cache

# Build specific tag
./scripts/docker-build.sh --tag v1.0.0

# Build and push to registry
./scripts/docker-build.sh --tag v1.0.0 --push --registry ghcr.io/your-org
```

### Build Stages

The Dockerfile uses multi-stage builds:

1. **deps** - Install dependencies (~2GB)
2. **builder** - Build applications (~2GB)
3. **web-runner** - Web app runtime (~317MB)
4. **legal-runner** - Legal search runtime (~308MB)

## 📊 Resource Usage

### Development Mode (Infrastructure Only)
- **RAM:** ~1.5GB
- **CPU:** ~10-20%
- **Disk:** ~2GB

### Full Stack Mode
- **RAM:** ~4GB
- **CPU:** ~30-50%
- **Disk:** ~4GB

### Production Mode (with replicas)
- **RAM:** ~8GB
- **CPU:** ~50-80%
- **Disk:** ~5GB

## 🐛 Troubleshooting

### Issue: Services won't start

**Solution:**
```bash
# Check Docker status
docker info

# View logs
docker-compose logs

# Check resources
docker system df

# Restart Docker Desktop
```

### Issue: Port already in use

**Solution:**
```bash
# Find process using port
# Linux/macOS:
lsof -i :3005

# Windows:
netstat -ano | findstr :3005

# Change port in .env
WEB_APP_PORT=3006
```

### Issue: Build fails with "no space left on device"

**Solution:**
```bash
# Clean Docker resources
make clean
# OR: docker system prune -af

# Check available space
docker system df
```

### Issue: Cannot connect to database

**Solution:**
```bash
# Check PostgreSQL status
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres
```

### Issue: Application crashes on startup

**Solution:**
```bash
# Check application logs
docker-compose logs web

# Verify environment variables
docker-compose config

# Restart service
docker-compose restart web
```

## 📈 Performance Optimization

### Build Performance

1. **Use build cache:**
   ```bash
   # Let Docker use cache
   docker-compose build
   ```

2. **Optimize .dockerignore:**
   - Already optimized in provided configuration
   - Excludes unnecessary files from build context

3. **Parallel builds:**
   ```bash
   # Turborepo handles this automatically
   docker-compose build --parallel
   ```

### Runtime Performance

1. **Resource limits (docker-compose.prod.yml):**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
   ```

2. **Health checks:**
   - All services have health checks
   - Prevents requests to unhealthy services

3. **Service replication:**
   ```bash
   docker-compose up -d --scale web=3
   ```

## 🔒 Security Best Practices

✅ **Implemented:**
- Non-root user (nextjs:nodejs)
- Minimal Alpine images
- Multi-stage builds (no build tools in production)
- Read-only configuration mounts
- Network isolation
- Health checks
- Resource limits

❗ **Additional Recommendations:**
1. Use secrets management (Docker Secrets, Vault)
2. Enable HTTPS in production
3. Regular security updates
4. Container scanning (Trivy, Snyk)
5. Implement rate limiting
6. Use private registries

## 📚 Additional Resources

- [DOCKER.md](./DOCKER.md) - Detailed Docker documentation
- [Dockerfile](./Dockerfile) - Optimized multi-stage Dockerfile
- [docker-compose.yml](./docker-compose.yml) - Base configuration
- [Makefile](./Makefile) - Convenience commands reference

## 🤝 Contributing

When modifying Docker configuration:

1. Test locally with different compose files
2. Verify builds complete successfully
3. Check image sizes stay reasonable
4. Update documentation
5. Test on different platforms (if possible)

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review logs: `make logs`
3. Check Docker resources: `docker system df`
4. Search GitHub issues
5. Create new issue with:
   - Docker version
   - Compose file used
   - Error logs
   - Steps to reproduce

---

**Last Updated:** 2026-02-16  
**Docker Version:** 29.1.3  
**Compose Version:** 2.x
