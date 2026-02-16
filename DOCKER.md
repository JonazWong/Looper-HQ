# Looper HQ Docker Configuration

Complete Docker containerization for the Looper HQ platform following Docker best practices.

## 📁 Files Created

- **`Dockerfile`** - Multi-stage optimized Dockerfile for both applications
- **`docker-compose.yml`** - Complete application stack for all environments
- **`docker-compose.prod.yml`** - Production-specific overrides
- **`docker-compose.dev.yml`** - Development-specific overrides
- **`scripts/docker-build.sh`** - Build script (Linux/macOS)
- **`scripts/docker-build.bat`** - Build script (Windows)

## 🚀 Quick Start

### Development (Infrastructure Only)

Run only databases and services, run apps locally:

```bash
# Start infrastructure services
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Run apps locally
pnpm dev
```

### Full Stack (All Services in Docker)

```bash
# Build images
./scripts/docker-build.sh

# Start all services
docker compose up -d

# With development tools (pgAdmin)
docker compose --profile tools up -d
```

### Production

```bash
# Build production images
./scripts/docker-build.sh --tag v1.0.0

# Start production stack
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🏗️ Architecture

### Services

1. **postgres** - PostgreSQL 16 database
   - Port: 5432
   - Volume: `postgres_data`
   - Health checks enabled

2. **redis** - Redis 7 cache
   - Port: 6379
   - Volume: `redis_data`
   - Persistent storage with AOF

3. **keycloak** - Keycloak 23 authentication
   - Port: 8080
   - Volume: `keycloak_data`
   - Auto-import realm configuration

4. **web** - Main Looper HQ application
   - Port: 3005 (maps to 3000 internally)
   - Built from `@looper-hq/web`
   - Next.js standalone output

5. **legal** - Legal Case Search application
   - Port: 3001 (maps to 3000 internally)
   - Built from `@looper-hq/legal-case-search`
   - Next.js standalone output

6. **pgadmin** - Database management UI (optional)
   - Port: 5050
   - Profile: `tools`

### Network

All services communicate via the `looper-hq-network` bridge network with subnet `172.28.0.0/16`.

## 📋 Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `KEYCLOAK_CLIENT_SECRET` - Keycloak client secret
- `OPENAI_API_KEY` - OpenAI API key

## 🔨 Build Scripts

### Linux/macOS

```bash
# Basic build
./scripts/docker-build.sh

# Build without cache
./scripts/docker-build.sh --no-cache

# Build and push to registry
./scripts/docker-build.sh --push --registry ghcr.io/your-org

# Build specific tag
./scripts/docker-build.sh --tag v1.0.0
```

### Windows

```cmd
REM Basic build
scripts\docker-build.bat

REM Build without cache
scripts\docker-build.bat --no-cache

REM Build and push to registry
scripts\docker-build.bat --push --registry ghcr.io/your-org

REM Build specific tag
scripts\docker-build.bat --tag v1.0.0
```

## 🎯 Common Tasks

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f web

# Last 100 lines
docker compose logs --tail=100 web
```

### Database Operations

```bash
# Run migrations
docker compose exec web pnpm db:migrate

# Access database
docker compose exec postgres psql -U postgres -d looper_hq

# Backup database
docker compose exec postgres pg_dump -U postgres looper_hq > backup.sql
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart web
```

### Scale Services (Production)

```bash
# Scale web to 3 replicas
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale web=3
```

### Stop and Clean Up

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v

# Stop and remove images
docker compose down --rmi all
```

## 🔒 Security Best Practices Implemented

1. **Non-root users** - Applications run as `nextjs:nodejs` (UID 1001)
2. **Multi-stage builds** - Minimal production images
3. **Read-only volumes** - Configuration mounted as read-only
4. **Health checks** - All services have health monitoring
5. **Resource limits** - Memory and CPU limits defined
6. **Network isolation** - Services communicate via internal network
7. **No secrets in images** - All secrets via environment variables

## 📊 Image Sizes

- **web**: ~317MB (production)
- **legal-case-search**: ~308MB (production)
- **postgres**: ~238MB
- **redis**: ~32MB
- **keycloak**: ~650MB

## 🐛 Troubleshooting

### Services won't start

```bash
# Check service status
docker compose ps

# View detailed logs
docker compose logs

# Check Docker resources
docker system df
```

### Database connection issues

```bash
# Verify database is healthy
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Test connection
docker compose exec postgres pg_isready -U postgres
```

### Build failures

```bash
# Clean build cache
docker builder prune

# Rebuild from scratch
./scripts/docker-build.sh --no-cache

# Check disk space
docker system df
```

### Port conflicts

Check if ports are already in use:

```bash
# Linux/macOS
lsof -i :3005
lsof -i :5432

# Windows
netstat -ano | findstr :3005
netstat -ano | findstr :5432
```

## 📈 Performance Tuning

### Development

```yaml
# docker-compose.dev.yml already configured for:
- Hot reload support
- Source code mounting
- Minimal resource limits
```

### Production

```yaml
# docker-compose.prod.yml includes:
- Optimized PostgreSQL settings
- Redis persistence configuration
- Service replicas for scaling
- Enhanced logging
- Resource limits and reservations
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build Docker images
  run: |
    ./scripts/docker-build.sh \
      --tag ${{ github.sha }} \
      --registry ghcr.io/${{ github.repository }} \
      --push
```

### GitLab CI Example

```yaml
build:
  script:
    - ./scripts/docker-build.sh --tag $CI_COMMIT_SHA --push
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)

## 🤝 Contributing

When modifying Docker configuration:

1. Test locally with `docker compose up`
2. Verify builds with `./scripts/docker-build.sh`
3. Check image sizes with `docker images`
4. Update this documentation

## 📝 Notes

- **Health checks**: All services have health checks for proper startup ordering
- **Volumes**: Persistent data stored in named volumes
- **Networking**: Services can reference each other by service name
- **Profiles**: Use `--profile tools` to include development tools
- **Environment**: Override settings with `.env` file
