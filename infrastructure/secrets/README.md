# Secrets Directory

This directory contains example environment configuration files for production deployment.

## Files

- `.env.production.example` - Template for production environment variables

## Setup Instructions

1. Copy the example file to create your production environment file:
   ```bash
   cp .env.production.example ../.env.production
   ```

2. Edit the `.env.production` file and replace all placeholder values with actual credentials

3. Generate secure secrets:
   ```bash
   # For NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # For passwords (32 characters)
   openssl rand -base64 32
   ```

4. Set proper file permissions:
   ```bash
   chmod 600 ../.env.production
   ```

## Security Best Practices

- **Never commit** `.env.production` to version control
- Use **strong, unique passwords** for all services
- **Rotate secrets** regularly (at least every 90 days)
- Store backups of credentials in a **secure password manager**
- Use **different credentials** for development and production
- Enable **2FA** on all external services
- Regularly **audit access** to production credentials

## Required Secrets

### Must Generate
- `POSTGRES_PASSWORD` - Database password
- `REDIS_PASSWORD` - Redis password
- `NEXTAUTH_SECRET` - NextAuth.js session secret
- `KEYCLOAK_ADMIN_PASSWORD` - Keycloak admin password
- `GRAFANA_ADMIN_PASSWORD` - Grafana admin password

### Obtained from Keycloak
- `KEYCLOAK_CLIENT_SECRET` - Created in Keycloak admin console

### Optional (if using services)
- `SMTP_PASSWORD` - Email service password
- `SENTRY_AUTH_TOKEN` - Sentry error tracking token
- `AWS_SECRET_ACCESS_KEY` - For backup storage

## Environment Variables Reference

See `.env.production.example` for complete list with descriptions.
