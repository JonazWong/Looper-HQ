# 🚀 Looper HQ - DigitalOcean Deployment Guide

Complete guide for deploying Looper HQ to DigitalOcean with comprehensive production setup and migration procedures.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Droplet Setup](#initial-droplet-setup)
- [Domain Configuration](#domain-configuration)
- [SSL Setup](#ssl-setup)
- [Application Deployment](#application-deployment)
- [Monitoring Setup](#monitoring-setup)
- [Maintenance Tasks](#maintenance-tasks)
- [Backup & Restore](#backup--restore)
- [Pre-Migration Checks](#pre-migration-checks)
- [Troubleshooting](#troubleshooting)
- [Security Checklist](#security-checklist)

---

## Prerequisites

### DigitalOcean Droplet

**Recommended Specifications:**
- **Small Start**: 2 vCPU, 4GB RAM, 80GB SSD ($24/month)
- **Production**: 4 vCPU, 8GB RAM, 160GB SSD ($48/month)
- **High Traffic**: 8 vCPU, 16GB RAM, 320GB SSD ($96/month)

**Location**: Hong Kong or Singapore (for HK legal platform)

**OS**: Ubuntu 22.04 LTS

### Required Tools

- Git
- SSH access to droplet
- Domain name configured

---

## Initial Droplet Setup

### 1. Create Droplet

1. Log in to DigitalOcean
2. Create new Droplet with Ubuntu 22.04 LTS
3. Select appropriate size based on traffic needs
4. Choose Hong Kong or Singapore datacenter
5. Add your SSH key
6. Create droplet

### 2. Initial Connection

```bash
# Connect to your droplet
ssh root@YOUR_DROPLET_IP
```

### 3. Run Setup Script

```bash
# Download and run the setup script
curl -sSL https://raw.githubusercontent.com/JonazWong/Looper-HQ/main/infrastructure/deployment/scripts/setup-droplet.sh | sudo bash
```

Or manually:

```bash
# Clone repository
cd /opt
git clone https://github.com/JonazWong/Looper-HQ.git looper-hq
cd looper-hq

# Run setup script
sudo ./infrastructure/deployment/scripts/setup-droplet.sh
```

The script will:
- ✅ Update system packages
- ✅ Install Docker & Docker Compose
- ✅ Install Node.js 20 & pnpm
- ✅ Install Nginx
- ✅ Install Certbot for SSL
- ✅ Configure UFW firewall
- ✅ Create application directories
- ✅ Enable automatic security updates

### 4. Verify Installation

```bash
# Check installations
docker --version
docker compose version
node -v
pnpm -v
nginx -v
certbot --version
```

---

## Domain Configuration

### 1. DNS Setup

Configure your domain's DNS records:

```
Type    Name    Value           TTL
A       @       YOUR_DROPLET_IP 3600
A       www     YOUR_DROPLET_IP 3600
```

### 2. Update Nginx Configuration

Edit the Nginx site configuration:

```bash
cd /opt/looper-hq
nano infrastructure/deployment/docker/nginx/sites-enabled/looper-hq.conf
```

Replace `your-domain.com` with your actual domain.

---

## SSL Setup

### Automatic SSL with Let's Encrypt

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Start Nginx
sudo systemctl start nginx
```

### Configure Auto-Renewal

Certbot automatically sets up renewal. Verify:

```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

### Manual Renewal (if needed)

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## Application Deployment

### 1. Configure Environment Variables

```bash
cd /opt/looper-hq

# Copy example file
cp infrastructure/secrets/.env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required values:**
- `POSTGRES_PASSWORD` - Generate with: `openssl rand -base64 32`
- `REDIS_PASSWORD` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your domain (https://your-domain.com)
- `NEXT_PUBLIC_APP_URL` - Your domain
- `DATABASE_URL` - PostgreSQL connection string

**Secure the file:**
```bash
chmod 600 .env.production
```

### 2. Pre-Migration Checks

**IMPORTANT**: Before deploying or migrating, run the pre-migration check:

```bash
# Run pre-migration validation
pnpm pre-migration:check
```

This validates:
- Database connectivity
- Schema compatibility
- Data integrity
- Environment configuration
- Required services availability

### 3. Initial Deployment

```bash
cd /opt/looper-hq

# Deploy application
./infrastructure/deployment/scripts/deploy.sh
```

The deployment script will:
1. Pull latest code
2. Create database backup
3. Build Docker images
4. Run database migrations
5. Start containers with zero downtime
6. Run health checks
7. Clean up old images

### 4. Verify Deployment

```bash
# Check running containers
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml ps

# Check logs
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml logs -f

# Test health endpoint
curl http://localhost:3000/api/health

# Test via Nginx
curl https://your-domain.com/api/health
```

---

## Monitoring Setup

### 1. Start Monitoring Stack

```bash
cd /opt/looper-hq

# Copy monitoring environment file
cp infrastructure/secrets/.env.production.example .env.monitoring

# Start monitoring services
docker compose -f infrastructure/monitoring/docker-compose.monitoring.yml up -d
```

### 2. Access Monitoring Tools

**Prometheus**: http://YOUR_DROPLET_IP:9090
**Grafana**: http://YOUR_DROPLET_IP:3001

Default Grafana credentials:
- Username: `admin`
- Password: `admin` (change immediately)

### 3. Configure Grafana

1. Login to Grafana
2. Change admin password
3. Add Prometheus data source (http://prometheus:9090)
4. Import pre-built dashboards

---

## Maintenance Tasks

### Update Application

```bash
cd /opt/looper-hq
./infrastructure/deployment/scripts/deploy.sh
```

### View Logs

```bash
# All services
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml logs -f

# Specific service
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml logs -f web

# Last 100 lines
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml logs --tail=100
```

### Restart Services

```bash
# Restart all services
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml restart

# Restart specific service
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml restart web
```

### Check Resource Usage

```bash
# Container stats
docker stats

# System resources
htop
df -h
free -h
```

---

## Backup & Restore

### Manual Backup

```bash
cd /opt/looper-hq
./infrastructure/deployment/scripts/backup.sh
```

Backups are stored in `/opt/backups/looper-hq/`

### Automated Backups

Set up daily backups with cron:

```bash
sudo crontab -e
```

Add this line for daily backups at 2 AM:
```
0 2 * * * /opt/looper-hq/infrastructure/deployment/scripts/backup.sh >> /var/log/looper-hq/backup.log 2>&1
```

### Restore from Backup

```bash
cd /opt/looper-hq

# Restore latest backup
./infrastructure/deployment/scripts/restore.sh latest

# Restore specific backup
./infrastructure/deployment/scripts/restore.sh /opt/backups/looper-hq/looper-hq-20240115-120000.sql.gz
```

### Backup to Cloud Storage (Optional)

Configure DigitalOcean Spaces or S3 in `.env.production`:

```bash
BACKUP_S3_BUCKET=looper-hq-backups
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=sgp1
```

---

## Pre-Migration Checks

Before running any database migration, always execute the pre-migration check script:

```bash
# Run comprehensive pre-migration validation
pnpm pre-migration:check
```

### What Gets Validated

1. **Database Connectivity**
   - PostgreSQL connection test
   - Database existence verification
   - User permissions check

2. **Schema Compatibility**
   - Current schema version
   - Pending migrations
   - Schema conflicts

3. **Data Integrity**
   - Referential integrity checks
   - Orphaned records detection
   - Duplicate data verification

4. **Environment Configuration**
   - Required environment variables
   - Service availability
   - Disk space requirements

5. **Backup Verification**
   - Recent backup existence
   - Backup file integrity
   - Restore capability test

### Migration Workflow

1. **Pre-check**: Run `pnpm pre-migration:check`
2. **Backup**: Automatic backup created
3. **Migrate**: Apply migrations with `pnpm db:migrate`
4. **Validate**: Run `pnpm --filter=@looper-hq/migration validate`
5. **Verify**: Check application health

### Rollback Procedure

If migration fails:

```bash
# Stop application
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml down

# Restore from backup
./infrastructure/deployment/scripts/restore.sh latest

# Restart application
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check container status
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml ps

# Check logs
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml logs web

# Verify environment variables
cat .env.production

# Restart containers
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml restart
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml logs postgres

# Test connection
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml exec postgres psql -U looper_admin -d looper_hq -c "SELECT 1"

# Check DATABASE_URL in .env.production
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a --volumes

# Clean old backups
find /opt/backups/looper-hq -name "*.sql.gz" -mtime +7 -delete

# Clean logs
sudo journalctl --vacuum-time=7d
```

### High Memory Usage

```bash
# Check memory
free -h

# Check container memory
docker stats

# Restart hungry containers
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml restart
```

### Health Check Failures

```bash
# Manual health check
./infrastructure/deployment/scripts/health-check.sh

# Check web service
curl http://localhost:3000/api/health

# Check Nginx proxy
curl http://localhost/api/health

# View web logs
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml logs web
```

---

## Security Checklist

### Essential Security Tasks

- [ ] Change all default passwords
- [ ] Configure UFW firewall (ports 22, 80, 443 only)
- [ ] Set up SSH key authentication (disable password login)
- [ ] Enable automatic security updates
- [ ] Configure SSL/TLS with strong ciphers
- [ ] Set secure file permissions on `.env.production` (600)
- [ ] Enable rate limiting in Nginx
- [ ] Configure security headers
- [ ] Set up fail2ban for SSH protection
- [ ] Regular security updates: `apt update && apt upgrade`
- [ ] Monitor logs for suspicious activity
- [ ] Rotate secrets every 90 days
- [ ] Enable database backups
- [ ] Test backup restoration regularly
- [ ] Configure monitoring and alerting

### SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Disable password authentication
PasswordAuthentication no

# Disable root login (after setting up sudo user)
PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

### Install Fail2Ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## GitHub Actions CI/CD

### Setup

1. Go to GitHub repository settings
2. Navigate to Secrets and Variables → Actions
3. Add secrets:
   - `DROPLET_IP`: Your droplet IP address
   - `SSH_PRIVATE_KEY`: SSH private key for deployment
   - `PRODUCTION_DOMAIN`: Your domain name

### Workflow

Push to `main` branch triggers automatic deployment:

```bash
git push origin main
```

The workflow will:
1. Run tests and linting
2. Build application
3. SSH to droplet
4. Execute deploy.sh
5. Verify deployment
6. Notify on success/failure

---

## Useful Commands

```bash
# Application directory
cd /opt/looper-hq

# Start all services
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml up -d

# Stop all services
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml down

# View logs
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml logs -f

# Rebuild and restart
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml up -d --build

# Check status
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml ps

# Execute command in container
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml exec web sh

# Database console
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml exec postgres psql -U looper_admin -d looper_hq

# Redis console
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml exec redis redis-cli
```

---

## Architecture Diagram

```
Internet
    ↓
[Cloudflare CDN] (Optional)
    ↓
[Nginx :80, :443]
    ├─ SSL Termination
    ├─ Rate Limiting
    ├─ Caching
    └─ Security Headers
    ↓
├─ Next.js App :3000
├─ PostgreSQL :5432
└─ Redis :6379

[Monitoring]
├─ Prometheus :9090
├─ Grafana :3001
└─ Exporters
```

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/JonazWong/Looper-HQ/issues
- Documentation: Check `/docs` directory
- Full Deployment Guide: [infrastructure/deployment/README.md](../../infrastructure/deployment/README.md)

---

**🎉 Looper HQ is now live and ready to serve Premier HK legal cases!**
