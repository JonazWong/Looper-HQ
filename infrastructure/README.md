# 🏗️ Looper HQ Infrastructure

This directory contains all infrastructure configuration for the Looper HQ platform, including Docker Compose setup, database initialization scripts, and authentication server configuration.

## 📋 Table of Contents

- [Overview](#overview)
- [Services](#services)
- [Quick Start](#quick-start)
- [Port Mappings](#port-mappings)
- [Access Credentials](#access-credentials)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## 🌐 Overview

The infrastructure is containerized using Docker Compose and includes the following services:
- **PostgreSQL 16**: Primary database with UTF-8 support for Hong Kong legal cases
- **Redis 7**: Cache layer, session storage, and rate limiting
- **Keycloak 23**: Authentication and authorization (OAuth/OIDC)
- **pgAdmin 4**: Database management UI (optional)

All services are configured for Hong Kong timezone (`Asia/Hong_Kong`) and include proper health checks, persistence, and security settings.

## 🚀 Services

### PostgreSQL 16

**Purpose**: Primary database for application data and Keycloak authentication backend

**Features**:
- UTF-8 encoding for Hong Kong legal case support
- Connection pooling optimized for development
- Automatic database initialization
- Persistent storage using Docker volumes
- Health checks for container orchestration

**Configuration Files**:
- `docker/docker-compose.yml`: Main service configuration
- `postgres/init/01-init-databases.sql`: Database initialization script

**Default Credentials**:
- User: `postgres`
- Password: `postgres`
- Database: `looper_hq`
- Keycloak DB: `keycloak`

### Redis 7

**Purpose**: Cache layer, session storage, and rate limiting

**Features**:
- AOF (Append-Only File) persistence for durability
- RDB snapshots for backup (900s/1 key, 300s/10 keys, 60s/10000 keys)
- Memory limit: 256MB with LRU eviction policy
- Optional password protection
- Health checks

**Configuration**:
- Persistence: AOF + RDB
- Max Memory: 256MB
- Eviction Policy: allkeys-lru

### Keycloak 23

**Purpose**: Authentication and authorization server with OAuth/OIDC support

**Features**:
- Pre-configured `looper-hq` realm
- PostgreSQL backend for session storage
- Development mode with HTTP enabled
- Auto-import realm configuration on startup
- Health and metrics endpoints enabled
- Brute force protection enabled

**Configuration Files**:
- `keycloak/realms/looper-hq-realm.json`: Realm configuration template

**Pre-configured Clients**:
1. `looper-hq-web`: Main web application
2. `looper-hq-admin`: Admin portal

**Pre-configured Roles**:
- `user`: Standard user role
- `lawyer`: Lawyer role with case management access
- `admin`: Administrator role with full access
- `client`: Client role for case inquiry

**Default Users**:
| Username | Password   | Role   | Email                    |
|----------|------------|--------|--------------------------|
| admin    | admin123   | admin  | admin@looper-hq.local    |
| lawyer   | lawyer123  | lawyer | lawyer@looper-hq.local   |
| client   | client123  | client | client@looper-hq.local   |

**⚠️ Security Note**: Change these credentials in production!

### pgAdmin 4 (Optional)

**Purpose**: Web-based database management interface

**Features**:
- Visual database management
- Query execution and analysis
- Database monitoring
- Disabled by default (use `--profile tools` to start)

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- pnpm 8.0+

### Starting Services

```bash
# Start all core services (PostgreSQL, Redis, Keycloak)
pnpm docker:up

# Start with pgAdmin (optional)
docker-compose -f infrastructure/docker/docker-compose.yml --profile tools up -d

# View logs
pnpm docker:logs

# Check service status
pnpm docker:ps
```

### Stopping Services

```bash
# Stop all services (preserves data)
pnpm docker:down

# Stop and remove all data
pnpm docker:clean
```

### Restarting Services

```bash
# Restart all services
pnpm docker:restart

# Restart specific service
docker-compose -f infrastructure/docker/docker-compose.yml restart postgres
```

## 🔌 Port Mappings

| Service    | Internal Port | External Port | Purpose                |
|------------|---------------|---------------|------------------------|
| PostgreSQL | 5432          | 5432          | Database connections   |
| Redis      | 6379          | 6379          | Cache/Session storage  |
| Keycloak   | 8080          | 8080          | Auth server & Admin UI |
| pgAdmin    | 80            | 5050          | Database management UI |

**Note**: External ports can be customized via environment variables (e.g., `POSTGRES_PORT=5433`)

## 🔑 Access Credentials

### Development Environment

**PostgreSQL**:
```
Host: localhost
Port: 5432
User: postgres
Password: postgres
Database: looper_hq
Connection URL: postgresql://postgres:postgres@localhost:5432/looper_hq
```

**Redis**:
```
Host: localhost
Port: 6379
Password: (optional, not set by default)
Connection URL: redis://localhost:6379
```

**Keycloak Admin Console**:
```
URL: http://localhost:8080
Username: admin
Password: admin
Realm: looper-hq
```

**pgAdmin** (when enabled with `--profile tools`):
```
URL: http://localhost:5050
Email: admin@looper-hq.dev
Password: admin
```

**⚠️ Important**: These are development-only credentials. **Never use these in production!**

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize as needed:

```bash
cp .env.example .env
```

Key variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/looper_hq
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=looper_hq

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=  # Optional

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_FRONTEND_URL=http://localhost:8080
```

### Customizing Ports

Override default ports via environment variables:

```env
POSTGRES_PORT=5433
REDIS_PORT=6380
KEYCLOAK_PORT=8081
PGADMIN_PORT=5051
```

### Keycloak Realm Configuration

The Keycloak realm is automatically imported from `infrastructure/keycloak/realms/looper-hq-realm.json`.

To customize:
1. Edit the realm JSON file
2. Restart Keycloak: `docker-compose -f infrastructure/docker/docker-compose.yml restart keycloak`

Or use the Keycloak Admin Console to make changes via UI.

## 🔧 Troubleshooting

### Services Won't Start

**Problem**: Docker containers fail to start

**Solutions**:
```bash
# Check if ports are already in use
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :6379  # Redis
sudo lsof -i :8080  # Keycloak

# Stop conflicting services or change ports in .env

# Check Docker daemon is running
docker info

# View detailed logs
pnpm docker:logs
```

### PostgreSQL Connection Refused

**Problem**: Cannot connect to PostgreSQL

**Solutions**:
```bash
# Check if PostgreSQL is healthy
docker-compose -f infrastructure/docker/docker-compose.yml ps

# Check logs
docker logs looper-hq-db

# Verify connection inside container
docker exec -it looper-hq-db psql -U postgres -d looper_hq

# Wait for health check (may take 10-30 seconds after start)
```

### Keycloak Not Starting

**Problem**: Keycloak container exits or fails health checks

**Solutions**:
```bash
# Keycloak requires PostgreSQL to be healthy first
# Wait 30-60 seconds for full startup

# Check logs for errors
docker logs looper-hq-keycloak

# Verify database connection
docker exec -it looper-hq-db psql -U postgres -l | grep keycloak

# Restart Keycloak
docker-compose -f infrastructure/docker/docker-compose.yml restart keycloak
```

### Redis Connection Issues

**Problem**: Cannot connect to Redis

**Solutions**:
```bash
# Check Redis is running
docker logs looper-hq-redis

# Test connection
docker exec -it looper-hq-redis redis-cli ping
# Should return: PONG

# If password is set, use:
docker exec -it looper-hq-redis redis-cli -a your-password ping
```

### Data Persistence Issues

**Problem**: Data is lost after container restart

**Solutions**:
```bash
# Verify volumes exist
docker volume ls | grep looper

# Don't use docker:clean unless you want to delete data
# Use docker:down to preserve data:
pnpm docker:down

# If you need to reset data:
pnpm docker:clean  # This WILL delete all data!
pnpm docker:up
```

### Keycloak Realm Not Imported

**Problem**: looper-hq realm doesn't exist in Keycloak

**Solutions**:
```bash
# Verify realm file exists
ls -la infrastructure/keycloak/realms/

# Check Keycloak logs for import errors
docker logs looper-hq-keycloak | grep -i import

# Manually import via Admin Console:
# 1. Go to http://localhost:8080
# 2. Login as admin
# 3. Hover over realm name, click "Add realm"
# 4. Import infrastructure/keycloak/realms/looper-hq-realm.json
```

### Performance Issues

**Problem**: Services are slow or unresponsive

**Solutions**:
```bash
# Check Docker resource allocation
docker stats

# Adjust resource limits in Docker Desktop settings:
# - Increase CPUs (recommend 2+)
# - Increase Memory (recommend 4GB+)

# For PostgreSQL: Tune settings in init script
# For Redis: Adjust maxmemory in docker-compose.yml
```

### Health Check Failures

**Problem**: Container shows unhealthy status

**Solutions**:
```bash
# Check health check status
docker inspect looper-hq-db | grep -A 10 Health
docker inspect looper-hq-redis | grep -A 10 Health
docker inspect looper-hq-keycloak | grep -A 10 Health

# Some services need time to start (especially Keycloak: 60s)
# Wait and check again

# Restart unhealthy service
docker-compose -f infrastructure/docker/docker-compose.yml restart <service-name>
```

### Network Issues

**Problem**: Services can't communicate with each other

**Solutions**:
```bash
# Verify network exists
docker network ls | grep looper

# Check which services are on the network
docker network inspect looper-hq-network

# Recreate network
pnpm docker:down
pnpm docker:up
```

### Cleaning Up Completely

If all else fails, complete reset:

```bash
# Stop and remove everything
pnpm docker:clean

# Remove any orphaned containers
docker container prune -f

# Remove any orphaned volumes
docker volume prune -f

# Start fresh
pnpm docker:up
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
- [Redis Documentation](https://redis.io/docs/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)

## 🔒 Security Notes

### Development Environment

- Default credentials are intentionally simple for development
- Services are exposed on localhost only
- No SSL/TLS configured (not needed for local development)

### Production Recommendations

1. **Change all default passwords**
2. **Enable SSL/TLS for all services**
3. **Use secrets management (e.g., Docker secrets, Vault)**
4. **Restrict network access**
5. **Enable Redis password authentication**
6. **Configure Keycloak for production mode**
7. **Set up proper backup strategy**
8. **Enable audit logging**
9. **Use non-root database users with minimal privileges**
10. **Keep images updated for security patches**

### Production Deployment

For production deployment on DigitalOcean, see:
- **[Deployment Guide](deployment/README.md)** - Complete production setup guide
- **[Quick Deploy](../QUICK_DEPLOY.md)** - Quick reference commands
- **[Deployment Summary](../DEPLOYMENT_SUMMARY.md)** - Infrastructure overview

Production infrastructure includes:
- ✅ Zero-downtime deployments with automated rollback
- ✅ Nginx reverse proxy with SSL/TLS
- ✅ Automated database backups
- ✅ Health monitoring with Prometheus & Grafana
- ✅ CI/CD with GitHub Actions
- ✅ Rate limiting and security hardening
- ✅ Comprehensive documentation

See `deployment/` directory for production configurations.

## 📝 Notes

- All services use `Asia/Hong_Kong` timezone
- PostgreSQL is configured with UTF-8 encoding for multilingual support
- Keycloak uses PostgreSQL as backend (not embedded H2)
- Redis uses both AOF and RDB for maximum data durability
- Health checks ensure proper startup order
- Volumes are named and managed by Docker Compose

---

For application-level documentation, see the [main README](../README.md).
