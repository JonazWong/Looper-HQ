# 🚀 Digital Ocean - Quick Reference

## Common Commands

### Deploy Latest Code

```bash
# Push to GitHub (auto-deploys if enabled)
git add .
git commit -m "your commit message"
git push origin main

# Wait 5-10 minutes for auto-deploy

# Or manually trigger:
# Digital Ocean Console → Apps → [Your App] → Actions → Redeploy
```

### Force Rebuild

```bash
# When you need to rebuild from scratch
# Digital Ocean Console → Apps → Actions → Force Rebuild and Deploy

# Or use doctl CLI:
doctl apps create-deployment <app-id> --force-rebuild
```

### View Logs

```bash
# Real-time logs in Digital Ocean Console
Apps → [Your App] → Runtime Logs

# Or use doctl CLI:
doctl apps logs <app-id> --follow

# Download logs:
doctl apps logs <app-id> --type=build > build.log
doctl apps logs <app-id> --type=run > runtime.log
```

### Restart App

```bash
# In Digital Ocean Console
Apps → Actions → Restart

# Or use doctl CLI:
doctl apps restart <app-id>
```

### Check Health

```bash
# Visit health endpoint
https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "openai": "configured",
  "timestamp": "2026-02-09T17:00:00.000Z"
}

# Or use curl:
curl https://your-domain.com/api/health
```

### Access Console

```bash
# In Digital Ocean Console
Apps → [Your App] → Console

# Common console commands:
cd apps/web
pnpm prisma migrate status
pnpm prisma studio
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\""
```

---

## Useful Links

| Resource | URL |
|----------|-----|
| **DO Console** | https://cloud.digitalocean.com/apps |
| **App Dashboard** | Apps → [Your App Name] |
| **Runtime Logs** | Apps → Runtime Logs |
| **Build Logs** | Apps → Activity → [Build] → View Logs |
| **Database** | Databases → [Your DB Name] |
| **Domains** | Networking → Domains |
| **Billing** | Account → Billing |
| **API Tokens** | API → Tokens/Keys |

### External Services

| Service | URL | Purpose |
|---------|-----|---------|
| **OpenRouter** | https://openrouter.ai/keys | AI API keys & credits |
| **Google Cloud** | https://console.cloud.google.com | OAuth credentials |
| **GitHub** | https://github.com/JonazWong/Looper-HQ | Source code |
| **DO Status** | https://status.digitalocean.com | Service status |

---

## Emergency Contacts

### Digital Ocean Support

- **Support Portal**: https://www.digitalocean.com/support
- **Community**: https://www.digitalocean.com/community
- **Status Page**: https://status.digitalocean.com
- **Documentation**: https://docs.digitalocean.com

### Response Times

| Ticket Type | Response Time |
|-------------|--------------|
| Critical | 1 hour |
| High | 4 hours |
| Normal | 12 hours |
| Low | 24 hours |

---

## Cost Breakdown

### Monthly Costs

| Resource | Plan | Specs | Cost/Month |
|----------|------|-------|------------|
| **App Platform** | Basic | 512MB RAM, 1 vCPU | $5 |
| **Database** | Basic | 1GB RAM, 10GB Storage | $15 |
| **Bandwidth** | Included | 1TB outbound | $0 |
| **Storage** | Included | 250GB | $0 |
| **Total** | | | **$20** |

### Scaling Options

| Plan | RAM | vCPU | Cost/Month | Good For |
|------|-----|------|------------|----------|
| Basic | 512MB | 1 | $5 | Development, small teams |
| Professional | 1GB | 1 | $12 | Production, medium traffic |
| Professional | 2GB | 2 | $24 | High traffic, complex apps |

### Database Scaling

| Plan | RAM | Storage | Connections | Cost/Month |
|------|-----|---------|-------------|------------|
| Basic | 1GB | 10GB | 25 | $15 |
| Basic | 2GB | 25GB | 50 | $30 |
| Professional | 4GB | 80GB | 100 | $60 |

---

## Monitoring

### Key Metrics to Watch

#### Application Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| **Response Time** | < 200ms | 200-500ms | > 500ms |
| **Error Rate** | < 1% | 1-5% | > 5% |
| **CPU Usage** | < 60% | 60-80% | > 80% |
| **Memory Usage** | < 70% | 70-90% | > 90% |
| **Uptime** | 99.9% | 99-99.9% | < 99% |

#### Database Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| **Connections** | < 15 | 15-20 | > 20 |
| **Query Time** | < 100ms | 100-500ms | > 500ms |
| **Storage** | < 70% | 70-85% | > 85% |
| **CPU** | < 60% | 60-80% | > 80% |

### View Metrics

```bash
# In Digital Ocean Console
Apps → [Your App] → Insights

# Available metrics:
- Request count
- Response time (p50, p95, p99)
- Error rate
- CPU usage
- Memory usage
- Network I/O
```

---

## Set Up Alerts

### Recommended Alerts

#### Performance Alerts

```bash
# In Digital Ocean Console
Apps → Alerts → Create Alert

Alert 1: High Response Time
- Metric: Response time (p95)
- Threshold: > 500ms
- Duration: 5 minutes
- Channel: Email

Alert 2: High Error Rate
- Metric: Error rate
- Threshold: > 5%
- Duration: 5 minutes
- Channel: Email + Slack
```

#### Resource Alerts

```bash
Alert 3: High CPU Usage
- Metric: CPU usage
- Threshold: > 90%
- Duration: 5 minutes
- Channel: Email

Alert 4: High Memory Usage
- Metric: Memory usage
- Threshold: > 90%
- Duration: 5 minutes
- Channel: Email
```

#### Database Alerts

```bash
Alert 5: Low Storage
- Metric: Storage usage
- Threshold: > 85%
- Duration: 1 minute
- Channel: Email + Slack

Alert 6: High Connection Count
- Metric: Active connections
- Threshold: > 20
- Duration: 5 minutes
- Channel: Email
```

### Configure Slack Notifications

```bash
# 1. Create Slack webhook
# Visit: https://api.slack.com/messaging/webhooks

# 2. Add to environment variables
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx

# 3. Test notification
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test from Looper HQ"}'
```

---

## Common Tasks

### Update Environment Variables

```bash
# 1. Navigate to app settings
Apps → Settings → Environment Variables

# 2. Click "Edit"

# 3. Add/modify variables

# 4. Click "Save"
# App will automatically redeploy
```

### Scale Resources

```bash
# Vertical scaling (more resources per instance)
Apps → Settings → Resources
- Select new plan (Professional, etc.)
- Click "Save"
- App will redeploy with new resources

# Horizontal scaling (more instances)
# Currently not available for App Platform Basic
# Upgrade to Professional for auto-scaling
```

### Update Domain

```bash
# Add custom domain
Apps → Settings → Domains
- Click "Add Domain"
- Enter domain: looper-hq.com
- Add CNAME record to DNS:
  looper-hq.com → <app-url>.ondigitalocean.app

# Verify and enable
- Click "Verify"
- Wait for DNS propagation (5-10 minutes)
- SSL will be auto-provisioned
```

### Database Maintenance

```bash
# Access database console
Databases → [Your DB] → Connection Details

# Connection string format:
postgresql://user:pass@host:port/database?sslmode=require

# Common maintenance tasks:
# 1. Backup
Databases → Backups → Create Backup

# 2. Restore
Databases → Backups → [Select Backup] → Restore

# 3. Resize
Databases → Settings → Resize
```

---

## Deployment Checklist

### Before Deployment

- [ ] All tests passing locally
- [ ] Code reviewed and merged to main
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Health check endpoint working

### During Deployment

- [ ] Monitor build logs
- [ ] Watch for errors
- [ ] Verify deployment completes
- [ ] Check runtime logs start

### After Deployment

- [ ] Visit app URL
- [ ] Test health endpoint
- [ ] Verify database connection
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Check performance metrics

---

## Troubleshooting Quick Guide

### App Not Loading

```bash
1. Check app status: Apps → [Your App] → Status
2. View runtime logs: Apps → Runtime Logs
3. Check health endpoint: /api/health
4. Verify environment variables
5. Restart app if needed
```

### Build Failed

```bash
1. View build logs: Apps → Activity → [Failed Build]
2. Check for common issues:
   - Missing dependencies
   - TypeScript errors
   - Environment variable issues
3. Fix and redeploy
```

### Database Connection Issues

```bash
1. Check database status: Databases → [Your DB]
2. Verify DATABASE_URL in environment variables
3. Test connection:
   Apps → Console
   psql $DATABASE_URL -c "SELECT 1"
4. Check connection pool:
   SELECT count(*) FROM pg_stat_activity;
```

### High Response Times

```bash
1. Check Insights → Response time metrics
2. Review runtime logs for slow queries
3. Check database query performance:
   Apps → Console
   pnpm --filter=@looper-hq/database prisma studio
4. Consider scaling resources
```

---

## Performance Optimization Tips

### Frontend

- ✅ Enable static page generation where possible
- ✅ Optimize images with Next.js Image component
- ✅ Implement proper caching headers
- ✅ Minimize bundle size
- ✅ Use CDN for static assets

### Backend

- ✅ Index frequently queried database columns
- ✅ Implement connection pooling
- ✅ Cache expensive operations
- ✅ Use database query optimization
- ✅ Implement rate limiting

### Database

- ✅ Regular VACUUM and ANALYZE
- ✅ Proper indexing strategy
- ✅ Query optimization
- ✅ Connection pool tuning
- ✅ Regular backups

---

## Backup Strategy

### Automated Backups

```bash
# Digital Ocean automatically backs up:
- Daily backups retained for 7 days
- Weekly backups retained for 4 weeks

# Configure in:
Databases → Settings → Backups
```

### Manual Backups

```bash
# Before major changes
Databases → Backups → Create Backup
Name: "pre-deployment-YYYY-MM-DD"

# Or use pg_dump:
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Backup Verification

```bash
# Test restore process quarterly
1. Create test database
2. Restore from backup
3. Verify data integrity
4. Document results
```

---

## Security Checklist

- [ ] HTTPS enabled (SSL auto-provisioned)
- [ ] Environment variables encrypted
- [ ] Database SSL connections enforced
- [ ] API rate limiting configured
- [ ] Secrets rotated regularly
- [ ] 2FA enabled on DO account
- [ ] Access logs reviewed monthly
- [ ] Backup tested quarterly

---

## Additional Resources

- 📖 [Migration Guide](./migrate-from-agency.md)
- 🔐 [Environment Variables Guide](./environment-variables.md)
- 📚 [Full Deployment Guide](./README.md)
- 🏗️ [Architecture Documentation](../ARCHITECTURE.md)

---

**Last Updated**: 2026-02-09  
**Version**: 2.0.0
