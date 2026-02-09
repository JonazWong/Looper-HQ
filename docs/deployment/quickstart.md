# 🚀 Quick Start Deployment

## 5-Minute Deployment to Digital Ocean

This guide provides the fastest path to get Looper HQ running in production.

---

## Option 1: Digital Ocean App Platform (Recommended)

### Prerequisites
- GitHub account
- Digital Ocean account
- Domain name (optional)

### Steps

#### 1️⃣ Push to GitHub
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

#### 2️⃣ Create Digital Ocean App

1. Login to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Select **GitHub** and connect your repository
4. Choose repository: `JonazWong/Looper-HQ`
5. Select branch: `main`
6. App Platform will automatically read `.do/app.yaml`

#### 3️⃣ Configure Environment Variables

In the App Platform dashboard, set these **required** environment variables:

```env
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Other variables are automatically injected (like `DATABASE_URL`) or optional.

#### 4️⃣ Create Database

1. In the same App Platform setup, add a **PostgreSQL** database
2. Choose **PostgreSQL 15** or higher
3. Select **Development** ($15/month) or **Production** tier
4. Database credentials will be automatically injected

#### 5️⃣ Deploy

1. Click **"Create Resources"**
2. Wait for build to complete (5-10 minutes)
3. Your app will be live at `<app-name>.ondigitalocean.app`

#### 6️⃣ Configure Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your domain name
3. Update your DNS records:
   - Type: `CNAME`
   - Name: `@` (or `www`)
   - Value: The address provided by Digital Ocean
4. Wait for DNS propagation (5-30 minutes)

---

## Option 2: Self-Hosted Deployment

### Prerequisites
- Server with Ubuntu 20.04+
- Root/sudo access
- Domain pointing to server IP

### Quick Setup

```bash
# 1. SSH to your server
ssh root@YOUR_SERVER_IP

# 2. Run automated setup script
curl -sSL https://raw.githubusercontent.com/JonazWong/Looper-HQ/main/infrastructure/deployment/scripts/setup-droplet.sh | sudo bash

# 3. Clone repository
cd /opt
git clone https://github.com/JonazWong/Looper-HQ.git looper-hq
cd looper-hq

# 4. Configure environment
cp .env.production.example .env.production
nano .env.production  # Edit with your values
chmod 600 .env.production

# 5. Setup SSL certificates
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 6. Deploy
./infrastructure/deployment/scripts/deploy.sh
```

### Required Environment Variables

Edit `.env.production` with these values:

```env
# Generate secure passwords
POSTGRES_PASSWORD=<openssl rand -base64 32>
REDIS_PASSWORD=<openssl rand -base64 32>
NEXTAUTH_SECRET=<openssl rand -base64 32>
KEYCLOAK_ADMIN_PASSWORD=<strong-password>

# Configure URLs
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
KEYCLOAK_HOSTNAME=your-domain.com
```

---

## Post-Deployment Setup

### 1. Create Admin Account

Visit your deployed URL and register the first account:
```
https://your-domain.com/register
```

This first account will have admin privileges.

### 2. Test Key Features

Verify these features work:
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] Login functionality works
- [ ] Dashboard is accessible
- [ ] Database operations work
- [ ] Public case search works

### 3. Configure Crawlers (Optional)

To enable automated legal case tracking:

```bash
# Set in environment variables
CRAWLER_ENABLED=true
RSS_TIMEOUT=30000
RSS_MAX_RETRIES=3
```

The system will automatically crawl:
- South China Morning Post (SCMP)
- RTHK (Hong Kong Radio)
- Additional sources as configured

---

## Daily Operations

### Deploy Updates

```bash
# Simply push to GitHub
git add .
git commit -m "Update feature"
git push origin main

# Digital Ocean automatically:
# 1. Builds new version
# 2. Runs health checks
# 3. Deploys with zero downtime
```

### View Logs

**Digital Ocean:**
- Go to App Platform → Your App → Runtime Logs

**Self-Hosted:**
```bash
cd /opt/looper-hq
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml logs -f
```

### Check Application Health

```bash
# Health check endpoint
curl https://your-domain.com/api/health

# Should return:
# {
#   "status": "healthy",
#   "checks": {
#     "database": { "status": "ok" },
#     "openai": { "status": "ok" },
#     "memory": { "status": "ok" }
#   }
# }
```

### Database Management

**Digital Ocean:**
- Access via App Platform dashboard
- Use Prisma Studio: `pnpm db:studio`

**Self-Hosted:**
```bash
# Backup database
./infrastructure/deployment/scripts/backup.sh

# Restore database
./infrastructure/deployment/scripts/restore.sh latest

# Access database
docker exec -it looper-postgres psql -U looper
```

---

## Troubleshooting

### Build Fails

**Check:**
1. All required environment variables are set
2. `.do/app.yaml` is valid
3. Build logs in Digital Ocean dashboard
4. Node.js version compatibility (requires 18+)

**Solution:**
```bash
# Test build locally
pnpm install
pnpm build

# Check for errors
pnpm lint
pnpm test
```

### Database Connection Issues

**Symptoms:**
- "Cannot connect to database" errors
- Health check fails

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check database is running
3. Verify database firewall rules (allow App Platform IPs)
4. Test connection:
   ```bash
   pnpm db:studio
   ```

### Application Not Starting

**Check:**
1. Environment variables are set correctly
2. Database migrations have run
3. Dependencies installed correctly

**Solution:**
```bash
# Manually run migrations
pnpm --filter=@looper-hq/web db:push

# Check application logs
# Digital Ocean: Runtime Logs section
```

### SSL Certificate Issues

**Self-Hosted Only:**

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Cost Breakdown

### Digital Ocean App Platform

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| Web Service | Professional-XS (512MB) | $12 |
| Database | Development (1GB) | $15 |
| **Estimated Total** | | **$27/month** |

### Self-Hosted (Digital Ocean Droplet)

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| Droplet | 2GB RAM, 1 vCPU | $12 |
| **Estimated Total** | | **$12/month** |

*Note: Self-hosted requires more manual management but costs less*

---

## Next Steps

1. ✅ Application deployed
2. ✅ Admin account created
3. ✅ Basic features tested
4. 📖 Read [full deployment guide](./README.md) for advanced configuration
5. 🔧 Configure monitoring and alerts
6. 📊 Set up analytics (optional)
7. 🔄 Enable automated backups

---

## Support Resources

- 📖 [Full Deployment Guide](./README.md)
- 🏗️ [Architecture Documentation](../ARCHITECTURE.md)
- 🐛 [Issue Tracker](https://github.com/JonazWong/Looper-HQ/issues)
- 📚 [Digital Ocean Docs](https://docs.digitalocean.com/products/app-platform/)

---

## Security Reminders

- ✅ Use strong, unique passwords
- ✅ Enable HTTPS (automatic on DO App Platform)
- ✅ Restrict database access to application only
- ✅ Regularly update dependencies
- ✅ Monitor application logs
- ✅ Set up automated backups
- ✅ Use environment variables for secrets (never commit to Git)

---

**Deployment Time:** ~15 minutes  
**Monthly Cost:** ~$27 (managed) or ~$12 (self-hosted)  
**Maintenance:** Low (fully automated on App Platform)

**Ready to deploy? Follow the steps above and you'll be live in minutes! 🚀**
