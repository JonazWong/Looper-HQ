# 🚀 Looper HQ - Quick Deployment Reference

## Initial Setup

```bash
# 1. SSH to droplet
ssh root@YOUR_DROPLET_IP

# 2. Run setup script
curl -sSL https://raw.githubusercontent.com/JonazWong/Looper-HQ/main/infrastructure/deployment/scripts/setup-droplet.sh | sudo bash

# 3. Clone repository
cd /opt
git clone https://github.com/JonazWong/Looper-HQ.git looper-hq
cd looper-hq

# 4. Configure environment
cp infrastructure/secrets/.env.production.example .env.production
nano .env.production  # Edit with your values
chmod 600 .env.production

# 5. Setup SSL
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 6. Deploy
./infrastructure/deployment/scripts/deploy.sh
```

## Daily Commands

```bash
# Deploy latest changes
cd /opt/looper-hq
./infrastructure/deployment/scripts/deploy.sh

# View logs
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml logs -f

# Check status
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml ps

# Restart service
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml restart web

# Backup database
./infrastructure/deployment/scripts/backup.sh

# Restore database
./infrastructure/deployment/scripts/restore.sh latest

# Health check
./infrastructure/deployment/scripts/health-check.sh
```

## Monitoring

```bash
# Start monitoring stack
docker compose -f infrastructure/monitoring/docker-compose.monitoring.yml up -d

# Access Prometheus: http://YOUR_IP:9090
# Access Grafana: http://YOUR_IP:3001
```

## Troubleshooting

```bash
# Check disk space
df -h

# Check memory
free -h

# Container stats
docker stats

# Clean Docker
docker system prune -a --volumes

# Restart everything
docker compose -f infrastructure/deployment/docker/docker-compose.prod.yml restart

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check SSL certificates
sudo certbot certificates
```

## GitHub Actions Setup

Add these secrets in GitHub repository settings:

- `DROPLET_IP`: Your droplet IP address
- `SSH_PRIVATE_KEY`: SSH private key for deployment
- `PRODUCTION_DOMAIN`: Your domain (e.g., looper-hq.com)

## Environment Variables to Configure

**Required:**
- `POSTGRES_PASSWORD` - `openssl rand -base64 32`
- `REDIS_PASSWORD` - `openssl rand -base64 32`
- `NEXTAUTH_SECRET` - `openssl rand -base64 32`
- `KEYCLOAK_ADMIN_PASSWORD` - Strong password
- `NEXTAUTH_URL` - https://your-domain.com
- `NEXT_PUBLIC_APP_URL` - https://your-domain.com
- `KEYCLOAK_HOSTNAME` - your-domain.com

## File Locations

- **Application**: `/opt/looper-hq`
- **Backups**: `/opt/backups/looper-hq`
- **Logs**: `/var/log/looper-hq`
- **SSL Certificates**: `/etc/letsencrypt/live/your-domain.com/`

## Port Mappings

- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS (Nginx → Next.js)
- **3000**: Next.js (internal)
- **5432**: PostgreSQL (internal)
- **6379**: Redis (internal)
- **8080**: Keycloak (internal, proxied via Nginx)
- **9090**: Prometheus (monitoring)
- **3001**: Grafana (monitoring)

## Security Checklist

- [ ] Changed all default passwords
- [ ] Configured UFW firewall
- [ ] Set up SSH key authentication
- [ ] Disabled password login
- [ ] SSL certificates installed
- [ ] .env.production has 600 permissions
- [ ] Automatic security updates enabled
- [ ] Backups configured
- [ ] Monitoring running

## Support

📚 Full Documentation: `/infrastructure/deployment/README.md`
🐛 Issues: https://github.com/JonazWong/Looper-HQ/issues
