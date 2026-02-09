# Deployment Guide

## Prerequisites

- Digital Ocean account
- GitHub repository access
- Domain name (optional)

## Initial Setup

### 1. Create Digital Ocean App

```bash
# Install doctl
brew install doctl  # macOS
# or
snap install doctl  # Linux

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec .do/app.yaml
```

### 2. Configure GitHub Secrets

Go to: `https://github.com/JonazWong/Looper-HQ/settings/secrets/actions`

Add the following secrets:

- `DIGITALOCEAN_ACCESS_TOKEN`: Your DO API token
- `DIGITALOCEAN_APP_ID`: App ID from step 1
- `DATABASE_URL`: Production database URL
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `OPENAI_API_KEY`: Your OpenRouter API key
- `APP_URL`: Your production URL
- `SLACK_WEBHOOK`: (Optional) For notifications

### 3. Configure Database

```bash
# Create managed PostgreSQL database
doctl databases create looper-hq-db \
  --engine pg \
  --version 15 \
  --region sgp1 \
  --size db-s-1vcpu-1gb

# Get connection string
doctl databases connection looper-hq-db

# Run migrations
DATABASE_URL="postgresql://..." pnpm --filter=@looper-hq/database prisma migrate deploy
```

### 4. Deploy

```bash
# Push to main branch to trigger deployment
git push origin main

# Or manually trigger
doctl apps create-deployment YOUR_APP_ID
```

## Monitoring

### Health Checks

```bash
curl https://looper-hq.app/api/health
```

### Logs

```bash
# View app logs
doctl apps logs YOUR_APP_ID --type run

# Follow logs
doctl apps logs YOUR_APP_ID --type run --follow
```

### Metrics

Visit: `https://cloud.digitalocean.com/apps/YOUR_APP_ID/metrics`

## Rollback

```bash
# List deployments
doctl apps list-deployments YOUR_APP_ID

# Rollback to previous deployment
doctl apps create-deployment YOUR_APP_ID \
  --deployment-id PREVIOUS_DEPLOYMENT_ID
```

## Troubleshooting

### Deployment Failed

1. Check GitHub Actions logs
2. Check Digital Ocean app logs
3. Verify environment variables
4. Check database connectivity

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
doctl databases pool list YOUR_DB_ID
```

### Health Check Failures

If the health check endpoint returns non-200 status:

1. Check database connectivity
2. Verify OpenAI/OpenRouter API keys are configured
3. Check memory usage (should be < 90%)
4. Review application logs

### Auto-Repair Script

The auto-repair script runs every 5 minutes to:
- Check database connectivity
- Terminate stale database connections
- Reconnect if needed

To run manually:

```bash
tsx scripts/auto-repair.ts
```

## Environment Variables

See `.env.production.example` for all required environment variables.

Critical variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Authentication secret
- `NEXTAUTH_URL`: Application URL
- `OPENAI_API_KEY`: AI service API key
- `OPENAI_BASE_URL`: OpenRouter endpoint
- `KEYCLOAK_*`: Authentication provider settings

## Performance Optimization

### Scaling

```bash
# Scale web instances
doctl apps update YOUR_APP_ID \
  --spec .do/app.yaml \
  --instance-count 3
```

### Database Connection Pooling

Recommended settings:
- Min pool size: 2
- Max pool size: 10
- Connection timeout: 30s

### CDN Configuration

Static assets are served from Digital Ocean CDN via the `static-assets` component.

## Security

1. Always use HTTPS in production
2. Rotate secrets regularly
3. Enable database SSL mode
4. Review security alerts in Digital Ocean dashboard
5. Keep dependencies updated

## Backup & Recovery

### Database Backups

Digital Ocean automatically backs up managed databases daily.

To create manual backup:

```bash
doctl databases backup create YOUR_DB_ID
```

### Application State

Application is stateless - all state in database. Ensure database backups are current.

## Support

For issues:
1. Check logs: `doctl apps logs YOUR_APP_ID`
2. Review GitHub Actions workflow runs
3. Contact Digital Ocean support
4. Review application error tracking (Sentry if configured)
