# 🚀 Looper HQ - Digital Ocean App Platform Deployment Guide

Complete guide for deploying Looper HQ to Digital Ocean App Platform with automatic CI/CD.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Variables Configuration](#environment-variables-configuration)
- [First Deployment](#first-deployment)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Database Migrations](#database-migrations)
- [Monitoring & Logging](#monitoring--logging)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Cost Optimization](#cost-optimization)

---

## Overview

Looper HQ uses Digital Ocean App Platform for production deployment, which provides:

✅ **Automated Deployments**: Push to `main` branch triggers automatic deployment  
✅ **Managed Database**: PostgreSQL 16 fully managed by Digital Ocean  
✅ **Zero Downtime**: Rolling deployments with health checks  
✅ **Auto-scaling**: Automatic scaling based on traffic  
✅ **Built-in Monitoring**: Metrics, logs, and alerts  
✅ **Docker Support**: Multi-stage Dockerfile for optimized builds  
✅ **Database Migrations**: Automatic migrations before deployment  

### Architecture

```
GitHub Repository (main branch)
    ↓ (push trigger)
GitHub Actions CI/CD
    ├─ Test & Build
    ├─ Deploy to DO App Platform
    └─ Health Check Verification
    ↓
Digital Ocean App Platform
    ├─ Pre-deploy: Database Migrations
    ├─ Build: Multi-stage Docker Build
    ├─ Deploy: Rolling Update
    └─ Health Check: /api/health
    ↓
Production Application
    ├─ Web Service (Next.js)
    └─ PostgreSQL 16 (Managed)
```

---

## Prerequisites

### 1. Digital Ocean Account

- Sign up at: https://www.digitalocean.com/
- Add payment method
- Verify email address

### 2. GitHub Repository Access

- Repository: `JonazWong/Looper-HQ`
- Access level: Admin (for setting secrets)

### 3. Required Tools (Local Development)

```bash
# doctl CLI (optional, for manual operations)
brew install doctl  # macOS
# or download from: https://docs.digitalocean.com/reference/doctl/how-to/install/

# Login to Digital Ocean
doctl auth init
```

### 4. Required Accounts & API Keys

- ✅ OpenRouter or OpenAI account with API key
- ✅ Digital Ocean account with payment method
- ⚪ Optional: Keycloak server (for SSO)
- ⚪ Optional: Sentry account (for error monitoring)

---

## Initial Setup

### Step 1: Create Digital Ocean App

#### Option A: Using Web Console (Recommended for First Time)

1. **Navigate to App Platform**
   - Go to: https://cloud.digitalocean.com/apps
   - Click **"Create App"**

2. **Connect GitHub Repository**
   - Select **"GitHub"** as source
   - Authorize Digital Ocean to access your GitHub
   - Choose repository: `JonazWong/Looper-HQ`
   - Select branch: `main`
   - Enable **"Autodeploy"** ✅

3. **Configure Resources**
   - Digital Ocean will detect the `.do/app.yaml` file
   - Review the configuration:
     - **Service**: Web (Next.js app)
     - **Database**: PostgreSQL 16
     - **Jobs**: Database migrations (pre-deploy)
   
4. **Select Region**
   - Choose: **Singapore (SGP)** or **San Francisco (SFO)**
   - Recommended: Singapore (closer to Hong Kong)

5. **Configure Environment Variables** (see next section)

6. **Review & Create**
   - Review pricing (starts at ~$17/month)
   - Click **"Create Resources"**

#### Option B: Using doctl CLI

```bash
# Create app from spec file
doctl apps create --spec .do/app.yaml

# Get the app ID (you'll need this for GitHub Actions)
doctl apps list
```

### Step 2: Note Your App ID

After creating the app, save the App ID:

```bash
# Find your app ID
doctl apps list

# Example output:
# ID                                    Spec Name    Default Ingress            Active Deployment ID
# abcd1234-5678-90ab-cdef-1234567890ab  looper-hq    looper-hq-xxxxx.ondigitalocean.app  ...
```

**Save this App ID** - you'll need it for GitHub Actions setup.

---

## Environment Variables Configuration

### Required Secrets (Set in DO App Platform UI)

Navigate to: **App Settings → App-Level Environment Variables**

#### 1. NEXTAUTH_SECRET (Required)

```bash
# Generate a secure secret
openssl rand -base64 32
```

Add in DO Console:
- **Key**: `NEXTAUTH_SECRET`
- **Value**: `<your-generated-secret>`
- **Scope**: Run and Build Time
- **Type**: Secret (encrypted) ✅

#### 2. OPENAI_API_KEY (Required)

Get your API key from:
- OpenRouter: https://openrouter.ai/keys
- Or OpenAI: https://platform.openai.com/api-keys

Add in DO Console:
- **Key**: `OPENAI_API_KEY`
- **Value**: `sk-or-v1-...` or `sk-...`
- **Scope**: Run and Build Time
- **Type**: Secret (encrypted) ✅

#### 3. DATABASE_URL (Auto-configured)

This is **automatically injected** by Digital Ocean from the managed database.  
**DO NOT set this manually** - it's defined as `${db.DATABASE_URL}` in `app.yaml`.

### Optional Variables

#### Keycloak SSO (Optional)

If using Keycloak for authentication:

- **KEYCLOAK_CLIENT_ID**: Your Keycloak client ID
- **KEYCLOAK_CLIENT_SECRET**: Your Keycloak client secret (Secret type)
- **KEYCLOAK_ISSUER**: `https://your-keycloak.com/realms/looper-hq`
- **NEXT_PUBLIC_KEYCLOAK_ENABLED**: `true`
- **NEXT_PUBLIC_KEYCLOAK_URL**: `https://your-keycloak.com`
- **NEXT_PUBLIC_KEYCLOAK_REALM**: `looper-hq`
- **NEXT_PUBLIC_KEYCLOAK_CLIENT_ID**: `looper-hq-web`

The server-side provider and the client-side SSO UI must be configured together. If you only set `KEYCLOAK_*` and omit the `NEXT_PUBLIC_KEYCLOAK_*` variables, the OAuth provider may exist but the login and registration pages will not expose the Keycloak entry points.

#### Error Monitoring (Optional)

- **SENTRY_DSN**: Your Sentry DSN for error tracking

#### File Storage (Optional)

For Digital Ocean Spaces:
- **DO_SPACES_ENDPOINT**: `sgp1.digitaloceanspaces.com`
- **DO_SPACES_BUCKET**: Your bucket name
- **DO_SPACES_ACCESS_KEY_ID**: Access key (Secret type)
- **DO_SPACES_SECRET_ACCESS_KEY**: Secret key (Secret type)

### Variables Auto-configured in app.yaml

These are already set in `.do/app.yaml` and don't need manual configuration:

✅ `NODE_ENV=production`  
✅ `TZ=Asia/Hong_Kong`  
✅ `NEXTAUTH_URL=${APP_URL}` (auto-generated)  
✅ `OPENAI_MODEL=gpt-5.1`  
✅ `OPENAI_BASE_URL=https://openrouter.ai/api/v1`  
✅ `AI_PROVIDER=openai`  
✅ `CRAWLER_ENABLED=true`  
✅ `CRAWLER_SCHEDULE=0 18 * * *`  

---

## First Deployment

### Step 1: Verify Configuration

```bash
# Clone the repository
git clone https://github.com/JonazWong/Looper-HQ.git
cd Looper-HQ

# Run pre-deployment validation script
./scripts/validate-deployment.sh

# This checks:
# ✅ Required files exist (Dockerfile, app.yaml, etc.)
# ✅ YAML syntax is valid
# ✅ Health check endpoint exists
# ✅ Required tools are installed
# ✅ Package scripts are configured

# If deploying with local environment, check env vars
export $(cat .env | xargs)
./scripts/check-env.sh

# This validates:
# ✅ Required: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
# ⚠️  Optional: OPENAI_API_KEY, KEYCLOAK_*, CRAWLER_*

# Review the app spec
cat .do/app.yaml

# Test Dockerfile build locally (optional but recommended)
docker build -t looper-hq-test .
```

### Step 2: Trigger First Deployment

#### Via Digital Ocean Console:

1. Go to your app in DO Console
2. Click **"Deploy"** button
3. Select **"Deploy from GitHub"**
4. Monitor the deployment logs

#### Via doctl CLI:

```bash
# Update app spec
doctl apps update YOUR_APP_ID --spec .do/app.yaml

# Trigger deployment
doctl apps create-deployment YOUR_APP_ID

# Watch deployment logs
doctl apps logs YOUR_APP_ID --follow
```

### Step 3: Monitor Deployment Progress

The deployment process includes:

1. **Building** (5-8 minutes)
   - Dependencies installation
   - Prisma client generation
   - Next.js build
   - Multi-stage Docker build

2. **Database Migration** (1-2 minutes)
   - Pre-deploy job runs
   - Executes: `npx prisma@5.17.0 migrate deploy --schema=packages/database/prisma/schema.prisma`

3. **Deployment** (2-3 minutes)
   - Rolling update to new version
   - Health checks every 30 seconds
   - Zero downtime transition

4. **Verification** (1 minute)
   - Health check endpoint: `/api/health`
   - Database connectivity test
   - Application readiness

**Total Time**: ~10-15 minutes for first deployment

### Step 4: Verify Deployment

```bash
# Get app URL
doctl apps get YOUR_APP_ID --format DefaultIngress --no-header

# Test health endpoint
curl https://your-app-xxxxx.ondigitalocean.app/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-02-14T...",
#   "database": "connected",
#   "uptime": 123,
#   ...
# }
```

---

## GitHub Actions CI/CD

### Setup GitHub Secrets

1. **Navigate to GitHub Repository Settings**
   ```
   https://github.com/JonazWong/Looper-HQ/settings/secrets/actions
   ```

2. **Add Required Secrets**

   Click **"New repository secret"** for each:

   #### DIGITALOCEAN_ACCESS_TOKEN
   
   - **Name**: `DIGITALOCEAN_ACCESS_TOKEN`
   - **Value**: Generate at https://cloud.digitalocean.com/account/api/tokens
     - Click **"Generate New Token"**
     - Name: `GitHub Actions - Looper HQ`
     - Scopes: Select **"Read"** and **"Write"**
     - Expiry: Choose appropriate duration
     - Copy the token (shown only once!)
   
   #### DIGITALOCEAN_APP_ID
   
   - **Name**: `DIGITALOCEAN_APP_ID`
   - **Value**: Your app ID from `doctl apps list`

### Workflow Configuration

The workflow file `.github/workflows/deploy-production.yml` is already configured with:

✅ **Triggers**:
- Automatic: Push to `main` branch
- Manual: `workflow_dispatch` in GitHub Actions UI

✅ **Stages**:
1. **Test & Build**: Lint, type-check, build, test
2. **Deploy**: Update app spec, trigger deployment
3. **Verify**: Health check validation

✅ **Features**:
- Wait for deployment completion (15 min timeout)
- Automatic health check verification
- Detailed deployment summary
- Failure notifications

### Triggering Deployments

#### Automatic Deployment (Recommended)

```bash
# Make changes to code
git add .
git commit -m "feat: add new feature"
git push origin main

# Deployment automatically triggered by GitHub Actions
# Monitor at: https://github.com/JonazWong/Looper-HQ/actions
```

#### Manual Deployment

1. Go to: https://github.com/JonazWong/Looper-HQ/actions
2. Select **"Deploy to Digital Ocean App Platform"**
3. Click **"Run workflow"**
4. Choose branch: `main`
5. Click **"Run workflow"**

### Monitoring Deployments

**GitHub Actions Logs**:
```
https://github.com/JonazWong/Looper-HQ/actions
```

**Digital Ocean Console**:
```
https://cloud.digitalocean.com/apps/YOUR_APP_ID/deployments
```

**doctl CLI**:
```bash
# List recent deployments
doctl apps list-deployments YOUR_APP_ID

# Watch logs
doctl apps logs YOUR_APP_ID --type=BUILD --follow
doctl apps logs YOUR_APP_ID --type=DEPLOY --follow
doctl apps logs YOUR_APP_ID --type=RUN --follow
```

---

## Database Migrations

### Automatic Migrations (Production)

Migrations run automatically before each deployment via the **pre-deploy job** in `app.yaml`:

```yaml
jobs:
  - name: db-migrate
    kind: PRE_DEPLOY
    run_command: |
         npx prisma@5.17.0 migrate deploy --schema=packages/database/prisma/schema.prisma
```

**Important (Monorepo + DigitalOcean App Platform):**
- Do not use plain `npx prisma migrate deploy` in pre-deploy jobs.
- Plain `npx prisma` may auto-install the latest Prisma CLI (for example Prisma 7), which can require Node.js >= 22 and fail on Node 20 build images.
- Always pin Prisma CLI version and pass explicit schema path for this repository layout.

**Process**:
1. Deployment triggered (push to main)
2. Pre-deploy job starts
3. Runs `npx prisma@5.17.0 migrate deploy --schema=packages/database/prisma/schema.prisma`
4. If successful, deployment continues
5. If fails, deployment aborts (rollback)

### Creating New Migrations

**Local Development**:

```bash
# Make changes to schema
nano packages/database/prisma/schema.prisma

# Create migration
pnpm --filter=@looper-hq/database prisma migrate dev --name add_new_field

# Test locally
pnpm db:push
pnpm db:seed

# Commit migration files
git add packages/database/prisma/migrations
git commit -m "feat: add new database field"
git push origin main

# Migration will run automatically on deployment
```

### Manual Migration (Emergency)

If you need to run migrations manually:

```bash
# Via doctl (requires app console access)
doctl apps create-deployment YOUR_APP_ID --force-build

# Or create a one-off job in DO Console:
# Apps → Your App → Jobs → Create Job
# Run: npx prisma@5.17.0 migrate deploy --schema=packages/database/prisma/schema.prisma
```

### Migration Rollback

If a migration fails in production:

1. **Automatic Rollback**: Deployment aborts, previous version continues
2. **Manual Rollback**:
   ```bash
   # Revert migration locally
   pnpm --filter=@looper-hq/database prisma migrate resolve --rolled-back MIGRATION_NAME
   
   # Fix the issue
   # Create new migration
   pnpm --filter=@looper-hq/database prisma migrate dev --name fix_migration
   
   # Deploy fix
   git push origin main
   ```

---

## Monitoring & Logging

### Application Logs

#### Via Digital Ocean Console

1. Navigate to: https://cloud.digitalocean.com/apps/YOUR_APP_ID
2. Click **"Logs"** tab
3. Filter by:
   - **Build logs**: Dockerfile build process
   - **Deploy logs**: Deployment progress
   - **Run logs**: Application runtime logs

#### Via doctl CLI

```bash
# Runtime logs (tail -f style)
doctl apps logs YOUR_APP_ID --type=RUN --follow

# Build logs
doctl apps logs YOUR_APP_ID --type=BUILD --follow

# Deploy logs
doctl apps logs YOUR_APP_ID --type=DEPLOY --follow

# All logs
doctl apps logs YOUR_APP_ID --follow
```

### Health Monitoring

#### Health Check Endpoint

```bash
# Check health
curl https://your-app.ondigitalocean.app/api/health

# Response:
{
  "status": "healthy",
  "timestamp": "2026-02-14T11:06:15.063Z",
  "database": "connected",
  "uptime": 3600,
  "checks": {
    "database": { "status": "ok", "responseTime": 45 },
    "openai": { "status": "ok", "configured": true },
    "memory": { "status": "ok", "used": 256, "total": 512, "percentage": 50 }
  },
  "version": "2.0.0"
}
```

#### Metrics Dashboard

Access in DO Console:
- **CPU Usage**: Real-time CPU utilization
- **Memory Usage**: Memory consumption
- **Request Rate**: Requests per second
- **Response Time**: Average latency
- **Error Rate**: 4xx/5xx errors

### Alerts Configuration

Already configured in `app.yaml`:

✅ **Deployment Failed**: Email when deployment fails  
✅ **Domain Failed**: SSL/domain configuration issues  
✅ **CPU Utilization**: Alert when >80%  
✅ **Memory Utilization**: Alert when >80%  
✅ **Restart Count**: Alert after 5 restarts  

**Configure Alert Destinations**:
1. Go to: Account → Settings → Notifications
2. Add email addresses or Slack webhooks
3. Choose which alerts to receive

### External Monitoring (Optional)

**Sentry for Error Tracking**:
```bash
# Add to DO environment variables
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

**Uptime Monitoring**:
- UptimeRobot: https://uptimerobot.com/
- Pingdom: https://www.pingdom.com/
- Monitor: `https://your-app.ondigitalocean.app/api/health`

---

## Rollback Procedures

### Quick Rollback (Recommended)

Digital Ocean keeps previous deployments for easy rollback:

#### Via Console:

1. Go to: Apps → Your App → Deployments
2. Find the last working deployment
3. Click **"⋮"** menu → **"Redeploy"**
4. Confirm rollback

#### Via doctl:

```bash
# List deployments
doctl apps list-deployments YOUR_APP_ID

# Find the deployment ID you want to rollback to
# Trigger redeployment
doctl apps create-deployment YOUR_APP_ID --deployment-id PREVIOUS_DEPLOYMENT_ID
```

### Git Rollback

If you need to revert code changes:

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or revert to specific commit
git revert COMMIT_SHA
git push origin main

# Automatic deployment will trigger with reverted code
```

### Database Rollback

⚠️ **Database rollbacks are complex** - always backup first!

```bash
# Via Prisma migration rollback
pnpm --filter=@looper-hq/database prisma migrate resolve --rolled-back MIGRATION_NAME

# Or restore from database backup
# (See DO Console → Databases → Backups)
```

### Emergency Rollback

If app is completely broken:

```bash
# Stop the app temporarily
doctl apps update YOUR_APP_ID --pause

# Fix the issue locally and test

# Redeploy fixed version
git push origin main

# Or manually unpause after verifying fix
doctl apps update YOUR_APP_ID --unpause
```

---

## Troubleshooting

### Build Failures

#### Issue: Dockerfile build fails

**Check**:
```bash
# Test Dockerfile locally
docker build -t looper-hq-test .

# Check build logs in DO Console
doctl apps logs YOUR_APP_ID --type=BUILD --tail=100
```

**Common Causes**:
- Missing dependencies in `package.json`
- Prisma client generation failure
- Out of memory during build (upgrade instance size)

**Fix**:
```bash
# Verify local build works
pnpm install --frozen-lockfile
pnpm --filter=@looper-hq/database prisma generate
pnpm build

# If successful locally, push
git push origin main
```

#### Issue: TypeScript errors

```bash
# Run type check locally
pnpm --filter=@looper-hq/web type-check

# Fix errors, then deploy
```

### Deployment Failures

#### Issue: Health check fails

**Symptoms**: Deployment completes but health check returns 503

**Debug**:
```bash
# Check runtime logs
doctl apps logs YOUR_APP_ID --type=RUN --tail=100

# Test health endpoint
curl -v https://your-app.ondigitalocean.app/api/health
```

**Common Causes**:
- Database connection failure
- Missing environment variables
- Port configuration mismatch

**Fix**:
1. Verify DATABASE_URL is set correctly
2. Check all required env vars are present
3. Ensure health check path is correct: `/api/health`

#### Issue: Missing environment variables

**Check locally**:
```bash
# Export your .env file
export $(cat .env | xargs)

# Run validation script
./scripts/check-env.sh

# This will show which required variables are missing
```

**Check in Digital Ocean**:
```bash
# Via doctl
doctl apps spec get YOUR_APP_ID

# Or in DO Console:
# Apps → Your App → Settings → App-Level Environment Variables
```

**Required variables**:
- `DATABASE_URL` - Auto-injected from database service
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your app URL (e.g., `https://your-app.ondigitalocean.app`)

**Optional but recommended**:
- `OPENAI_API_KEY` - For AI features
- `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER` - For OAuth provider
- `NEXT_PUBLIC_KEYCLOAK_ENABLED`, `NEXT_PUBLIC_KEYCLOAK_URL`, `NEXT_PUBLIC_KEYCLOAK_REALM`, `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` - For Keycloak SSO UI
- `CRAWLER_ENABLED` - For automated case crawling

#### Issue: Database connection refused

**Check environment variables**:
```bash
# In DO Console → App Settings → Environment Variables
# Verify DATABASE_URL is present (should be auto-injected)
```

**Verify database is running**:
```bash
# In DO Console → Databases
# Check status of PostgreSQL cluster
```

### Runtime Issues

#### Issue: 502 Bad Gateway

**Causes**:
- App crashed after deployment
- Port binding issue
- Out of memory

**Debug**:
```bash
# Check runtime logs for crash
doctl apps logs YOUR_APP_ID --type=RUN --tail=200

# Check metrics
# DO Console → Apps → Your App → Metrics
```

**Fix**:
- Increase instance size if OOM
- Check for unhandled exceptions in logs
- Verify PORT environment variable (should be 3000)

#### Issue: Slow response times

**Check**:
- Database query performance
- Memory usage (upgrade if >80%)
- Instance size (upgrade to Professional tier)

**Optimize**:
```bash
# Add database indexes in Prisma schema
# Optimize queries with proper includes
# Enable caching if needed
```

### Migration Issues

#### Issue: Migration fails during deployment

**Symptoms**: Pre-deploy job fails, deployment aborts

**Debug**:
```bash
# Check migration logs
doctl apps logs YOUR_APP_ID --type=DEPLOY --tail=100
```

**Fix**:
```bash
# Test migration locally first
pnpm db:push
pnpm --filter=@looper-hq/database prisma migrate deploy

# If successful locally, the issue might be:
# 1. Conflicting data in production
# 2. Locked database (wait and retry)
# 3. Schema conflict (resolve manually)

# If DO pre-deploy shows "Missing prisma schema" or Node engine errors,
# use this command in pre-deploy job:
# npx prisma@5.17.0 migrate deploy --schema=packages/database/prisma/schema.prisma
```

### Getting Help

**Pre-Deployment Validation**:
```bash
# Always run validation scripts before deploying
./scripts/validate-deployment.sh  # Check all deployment files
./scripts/check-env.sh           # Verify environment variables

# These scripts help catch configuration issues early
```

**Digital Ocean Support**:
- Free tier: Community support
- Paid tier: Ticket-based support
- https://www.digitalocean.com/support

**Looper HQ Issues**:
- GitHub Issues: https://github.com/JonazWong/Looper-HQ/issues
- Documentation: `/docs` directory

**Useful Resources**:
- DO App Platform Docs: https://docs.digitalocean.com/products/app-platform/
- App Spec Reference: https://docs.digitalocean.com/products/app-platform/reference/app-spec/
- doctl Documentation: https://docs.digitalocean.com/reference/doctl/

---

## Cost Optimization

### Pricing Breakdown (Estimated)

**Starter Setup** (~$17/month):
- Web Service: Basic XXS ($5/month)
- PostgreSQL 16: Basic 1GB ($15/month)
- Bandwidth: 100GB included

**Production Setup** (~$35/month):
- Web Service: Professional XS ($12/month)
- PostgreSQL 16: Basic 1GB ($15/month)
- Bandwidth: 100GB included

**High-Traffic Setup** (~$75/month):
- Web Service: Professional S ($24/month)
- PostgreSQL 16: Professional 4GB ($50/month)
- Bandwidth: 250GB included

### Cost Reduction Tips

1. **Right-size instances**
   ```bash
   # Start small, scale up based on metrics
   # Monitor CPU/Memory usage in DO Console
   ```

2. **Use database connection pooling**
   ```typescript
   // Already configured in Prisma
   // connectionLimit in DATABASE_URL
   ```

3. **Optimize Docker image size**
   ```dockerfile
   # Multi-stage build already implemented
   # Only production dependencies in final image
   ```

4. **Leverage caching**
   - Static assets served via CDN
   - Next.js automatic caching
   - Add Redis for session caching (optional)

5. **Monitor bandwidth usage**
   - Compress responses (enabled in Next.js)
   - Optimize images (WebP, AVIF)
   - Use CDN for large assets

### Scaling Strategy

**Horizontal Scaling** (more instances):
```yaml
# In .do/app.yaml
instance_count: 2  # Increase for high traffic
```

**Vertical Scaling** (larger instances):
```yaml
# In .do/app.yaml
instance_size_slug: professional-s  # Upgrade size
```

**Database Scaling**:
- Basic tier: 1-2GB RAM
- Professional tier: 4-8GB RAM (better performance)
- Enable read replicas for high-read workloads

---

## Next Steps After Deployment

### 1. Configure Custom Domain (Optional)

```bash
# In DO Console → Apps → Your App → Settings → Domains
# Add your domain: looper-hq.com
# Update DNS records as instructed
# SSL certificate is auto-generated by DO
```

### 2. Set Up Monitoring Alerts

- Configure Sentry for error tracking
- Set up UptimeRobot for uptime monitoring
- Enable DO email alerts for critical issues

### 3. Database Backups

Digital Ocean automatically backs up your database:
- Daily backups (retained 7 days for Basic tier)
- Point-in-time recovery available on Professional tier

### 4. Performance Optimization

- Monitor slow queries with Prisma logging
- Add database indexes for common queries
- Enable Next.js caching strategies
- Consider adding Redis for sessions

### 5. Security Hardening

- Rotate secrets every 90 days
- Enable 2FA on Digital Ocean account
- Set up rate limiting (already configured)
- Monitor access logs for suspicious activity

---

## Summary

### ✅ Deployment Checklist

- [ ] Digital Ocean account created
- [ ] App created in DO App Platform
- [ ] Database (PostgreSQL 16) provisioned
- [ ] Environment variables configured in DO Console
  - [ ] NEXTAUTH_SECRET
  - [ ] OPENAI_API_KEY
- [ ] GitHub Secrets configured
  - [ ] DIGITALOCEAN_ACCESS_TOKEN
  - [ ] DIGITALOCEAN_APP_ID
- [ ] First deployment successful
- [ ] Health check endpoint responding
- [ ] Database migrations completed
- [ ] GitHub Actions CI/CD tested
- [ ] Monitoring configured
- [ ] Custom domain configured (if applicable)

### 📚 Key Documentation

- **App Configuration**: `.do/app.yaml`
- **Dockerfile**: `Dockerfile` (root)
- **CI/CD Workflow**: `.github/workflows/deploy-production.yml`
- **Environment Variables**: `.env.production.example`
- **This Guide**: `docs/deployment-guide.md`

### 🎉 Congratulations!

Your Looper HQ application is now deployed to Digital Ocean App Platform with:

✅ Automatic deployments on push to `main`  
✅ Zero-downtime rolling updates  
✅ Automatic database migrations  
✅ Health check monitoring  
✅ Managed PostgreSQL database  
✅ SSL/TLS encryption  
✅ Built-in metrics and logging  

**Application URL**: https://your-app-xxxxx.ondigitalocean.app  
**Health Check**: https://your-app-xxxxx.ondigitalocean.app/api/health  
**DO Console**: https://cloud.digitalocean.com/apps/YOUR_APP_ID  

---

**Need Help?**  
- 📖 Review this guide  
- 🐛 Check [Troubleshooting](#troubleshooting) section  
- 💬 Open an issue: https://github.com/JonazWong/Looper-HQ/issues  
- 📧 Contact Digital Ocean support  

**Happy Deploying! 🚀**
