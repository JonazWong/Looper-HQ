# Deployment Guide

Complete guide for deploying Looper HQ to production.

## Quick Start (5 minutes)

```bash
# 1. Push to GitHub
git push origin main

# 2. Create Digital Ocean App
# Visit: https://cloud.digitalocean.com/apps
# Connect repo: JonazWong/Looper-HQ

# 3. Configure environment variables
# See: .env.production.example

# 4. Deploy!
```

## Detailed Guides

- [Digital Ocean Setup](./digitalocean.md) - Complete DO deployment guide
- [Quick Start Guide](./quickstart.md) - 5-minute simplified deployment
- [Environment Variables](../../.env.production.example) - Configuration reference

## Prerequisites

### Required Accounts
- GitHub account with access to the repository
- Digital Ocean account
- Domain name (optional, but recommended)

### Required Tools
- Git installed locally
- Node.js 18+ and pnpm
- Basic terminal/command line knowledge

## Deployment Options

### Option 1: Digital Ocean App Platform (Recommended)

**Pros:**
- Fully managed infrastructure
- Auto-scaling and load balancing
- Automated SSL certificates
- Built-in monitoring and logging
- GitHub integration for CI/CD
- Managed PostgreSQL database

**Cost:** ~$27/month (Web + Database)

**Setup Time:** ~15 minutes

See: [Digital Ocean Setup Guide](./digitalocean.md)

### Option 2: Self-Hosted Deployment

**Pros:**
- Full control over infrastructure
- Potentially lower cost at scale
- Custom configurations

**Cons:**
- More complex setup and maintenance
- Manual security updates
- No built-in monitoring

See: [Quick Start Guide](./quickstart.md) for self-hosted scripts

## Environment Variables

### Required Variables

```env
# Application
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# OpenAI/OpenRouter
OPENAI_API_KEY=<your-api-key>
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

### Optional Variables

```env
# OAuth (Keycloak)
KEYCLOAK_CLIENT_ID=<client-id>
KEYCLOAK_CLIENT_SECRET=<client-secret>
KEYCLOAK_ISSUER=https://your-keycloak-url/realms/looper

# Monitoring (Sentry)
SENTRY_DSN=<sentry-dsn>
SENTRY_AUTH_TOKEN=<sentry-token>

# Notifications
SLACK_WEBHOOK=<slack-webhook-url>

# Storage (Digital Ocean Spaces)
DO_SPACES_KEY=<spaces-key>
DO_SPACES_SECRET=<spaces-secret>
DO_SPACES_ENDPOINT=<endpoint>
DO_SPACES_BUCKET=<bucket-name>
```

For complete list, see [.env.production.example](../../.env.production.example)

## CI/CD Pipeline

The project includes automated deployment via GitHub Actions:

**Workflow Stages:**
1. **Test** - Type-check, lint, unit tests
2. **Build** - Production build with artifacts
3. **Deploy** - Automated Digital Ocean deployment
4. **Verify** - Health check verification

**Triggers:**
- Push to `main` or `production` branches
- Can be manually triggered

See `.github/workflows/deploy.yml` for configuration

## Health Monitoring

Health check endpoint: `/api/health`

**Monitors:**
- Database connectivity and response time
- OpenAI/OpenRouter API configuration
- Memory usage
- Application uptime

**Status Codes:**
- `200` - healthy or degraded
- `503` - unhealthy

## Database Setup

### Option 1: Digital Ocean Managed Database

1. Create PostgreSQL 15+ database cluster
2. Configure connection pooling
3. Set up automatic backups
4. Copy connection string to `DATABASE_URL`

### Option 2: Self-Hosted PostgreSQL

```bash
# Using Docker
docker run -d \
  --name looper-postgres \
  -e POSTGRES_DB=looper \
  -e POSTGRES_USER=looper \
  -e POSTGRES_PASSWORD=<secure-password> \
  -p 5432:5432 \
  postgres:16
```

### Database Migrations

```bash
# Push schema changes
pnpm --filter=@looper-hq/web db:push

# Or run migrations
pnpm --filter=@looper-hq/web db:migrate

# Seed database with sample data
pnpm --filter=@looper-hq/web db:seed
```

## Rollback Procedures

### Digital Ocean App Platform

1. Go to App Platform dashboard
2. Navigate to "Deployments" tab
3. Find the last working deployment
4. Click "Redeploy" next to that deployment

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force
```

## Troubleshooting

### Deployment Fails

**Check:**
- All required environment variables are set
- Database is accessible
- GitHub secrets are configured correctly
- Build logs in GitHub Actions

### Database Connection Issues

**Solutions:**
- Verify `DATABASE_URL` format
- Check database firewall rules
- Test connection with `pnpm db:studio`
- Check auto-repair script logs

### Health Check Failures

**Common causes:**
- Database not responding (>1000ms)
- Missing API keys
- Memory usage >90%

**Solution:**
```bash
# Check health manually
curl https://your-domain.com/api/health

# View logs
# In Digital Ocean: Runtime Logs
# Self-hosted: docker logs
```

## Security Checklist

- [ ] All environment variables use GitHub Secrets
- [ ] Database connections use SSL
- [ ] NEXTAUTH_SECRET is securely generated (`openssl rand -base64 32`)
- [ ] Domain has HTTPS enabled
- [ ] CORS is properly configured
- [ ] File upload limits are set
- [ ] Rate limiting is enabled

## Monitoring & Logging

### Digital Ocean Built-in

- Runtime logs (stdout/stderr)
- Metrics (CPU, Memory, Network)
- Health checks
- Alerts on failures

### External Monitoring (Optional)

- **Sentry** - Error tracking
- **LogDNA/Datadog** - Advanced logging
- **UptimeRobot** - Uptime monitoring

## Cost Estimation

### Digital Ocean App Platform

| Component | Spec | Monthly Cost |
|-----------|------|--------------|
| Web Service | 512MB RAM | $12 |
| PostgreSQL | 1GB RAM | $15 |
| **Total** | | **~$27** |

### Scaling Costs

| Scale Level | Web Service | Database | Total/Month |
|-------------|-------------|----------|-------------|
| Starter | 512MB | 1GB | $27 |
| Growth | 1GB | 2GB | $54 |
| Professional | 2GB | 4GB | $108 |

## Next Steps

1. Choose deployment option:
   - [Digital Ocean](./digitalocean.md) - Recommended for production
   - [Quick Deploy](./quickstart.md) - Self-hosted option

2. Set up environment variables

3. Configure custom domain (optional)

4. Enable monitoring and alerts

5. Set up backup schedule

---

## Additional Resources

- [Digital Ocean Documentation](https://docs.digitalocean.com/products/app-platform/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

**Need Help?**
- 📚 Check [troubleshooting section](#troubleshooting)
- 🐛 Open an issue: https://github.com/JonazWong/Looper-HQ/issues
- 📖 Read archive docs: [../archive/](../archive/)
