# 🔐 Environment Variables Reference

## Production Variables (Digital Ocean)

### Required Variables

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` | Auto-injected by DO |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | `random-32-char-string` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL | `https://looper-hq.com` | Your domain |
| `OPENAI_API_KEY` | OpenRouter API key | `sk-or-v1-xxx...` | https://openrouter.ai/keys |

### Optional Variables

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `OPENAI_BASE_URL` | OpenRouter endpoint | `https://openrouter.ai/api/v1` | Don't change unless using different provider |
| `OPENAI_MODEL` | AI model to use | `anthropic/claude-3.5-sonnet` | See available models at OpenRouter |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | - | Required for Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | - | Required for Google login |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Same as NEXTAUTH_URL | Used in client-side code |
| `NODE_ENV` | Environment mode | `production` | Set automatically by DO |
| `TZ` | Timezone | `Asia/Hong_Kong` | For correct timestamps |

### Crawler Configuration (Optional)

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `CRAWLER_ENABLED` | Enable/disable crawlers | `true` | Set to `false` to disable |
| `CRAWLER_SCHEDULE` | Cron schedule | `0 18 * * *` | Daily at 2am HKT |
| `RSS_TIMEOUT` | RSS feed timeout (ms) | `30000` | 30 seconds |
| `RSS_MAX_RETRIES` | Max retry attempts | `3` | Retry on failure |
| `RSS_USER_AGENT` | User agent string | `Looper-HQ/1.0` | For crawler requests |

### Advanced Configuration (Optional)

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `SLACK_WEBHOOK_URL` | Slack notification webhook | - | For deployment alerts |
| `SENTRY_DSN` | Sentry error tracking DSN | - | For error monitoring |
| `RATE_LIMIT_REQUESTS` | API rate limit | `100` | Requests per window |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` | 1 minute in ms |

---

## How to Set in Digital Ocean

### Method 1: Web UI (Recommended)

```bash
1. Log in to Digital Ocean Console
2. Navigate to: Apps → [Your App Name]
3. Click: Settings
4. Scroll to: "Environment Variables"
5. Click: "Edit"
6. Add new variables one by one
7. Click: "Save"
8. App will automatically redeploy
```

### Method 2: Bulk Editor (Fast)

```bash
1. In Environment Variables section
2. Click: "Bulk Editor"
3. Paste variables in KEY=VALUE format:

DATABASE_URL=${db.DATABASE_URL}
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.com
OPENAI_API_KEY=sk-or-v1-xxx...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-3.5-sonnet

4. Click: "Save"
5. App will automatically redeploy
```

### Method 3: App Spec YAML

```yaml
# .do/app.yaml
envs:
  - key: NEXTAUTH_SECRET
    value: ${NEXTAUTH_SECRET}
    scope: RUN_AND_BUILD_TIME
  - key: NEXTAUTH_URL
    value: https://your-domain.com
    scope: RUN_TIME
  - key: OPENAI_API_KEY
    value: ${OPENAI_API_KEY}
    scope: RUN_TIME
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
    scope: RUN_AND_BUILD_TIME
```

---

## Security Best Practices

### ✅ DO's

- **Use strong random secrets**: Generate with `openssl rand -base64 32`
- **Rotate keys regularly**: Every 90 days minimum
- **Use DO encrypted variables**: For sensitive data
- **Limit API key permissions**: Use read-only where possible
- **Use environment-specific keys**: Different keys for dev/staging/production
- **Enable 2FA on API providers**: Especially OpenRouter, Google OAuth

### ❌ DON'Ts

- **Never commit .env files**: Add to `.gitignore`
- **Never log secrets**: Sanitize logs before output
- **Never share production keys**: Use separate keys per environment
- **Never use default secrets**: Always generate random values
- **Never expose in client**: Use `NEXT_PUBLIC_` prefix only when necessary

---

## Generating Secure Secrets

### NEXTAUTH_SECRET

```bash
# Method 1: OpenSSL (recommended)
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Online (use with caution)
# Visit: https://generate-secret.vercel.app/32
```

### API Keys

#### OpenRouter

```bash
1. Visit: https://openrouter.ai/keys
2. Sign in or create account
3. Click: "Create Key"
4. Name: "Looper HQ Production"
5. Copy the key (starts with sk-or-v1-)
6. Save to Digital Ocean environment variables
7. Never commit to code!
```

#### Google OAuth

```bash
1. Visit: https://console.cloud.google.com
2. Create project: "Looper HQ"
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Authorized redirect URIs:
   - https://your-domain.com/api/auth/callback/google
6. Copy Client ID and Client Secret
7. Add to Digital Ocean environment variables
```

---

## Testing Variables Locally

### Setup Local Environment

```bash
# 1. Copy example file
cp .env.example .env.local

# 2. Edit with your values
nano .env.local

# 3. Fill in required variables
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"
NEXTAUTH_SECRET="your-local-secret-here"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-or-v1-xxx..."

# 4. Test
pnpm dev
```

### Verify Configuration

```bash
# Check if variables are loaded
pnpm dev

# Visit health check endpoint
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "openai": "configured",
  "timestamp": "2026-02-09T..."
}
```

---

## Variable Scope

### RUN_TIME vs BUILD_TIME

| Scope | When Available | Use Cases |
|-------|---------------|-----------|
| `RUN_TIME` | Only when app is running | API keys, secrets |
| `BUILD_TIME` | During build process | Feature flags |
| `RUN_AND_BUILD_TIME` | Both | DATABASE_URL, NEXTAUTH_SECRET |

### Example Configuration

```bash
# Build + Runtime (needed for Prisma generation)
DATABASE_URL=${db.DATABASE_URL}
NEXTAUTH_SECRET=xxx

# Runtime only (secrets)
OPENAI_API_KEY=sk-or-v1-xxx
GOOGLE_CLIENT_SECRET=xxx

# Build only (public variables)
NEXT_PUBLIC_APP_URL=https://looper-hq.com
```

---

## Troubleshooting

### Problem: "Missing environment variable"

**Solution**:
```bash
1. Check Digital Ocean Console
   Apps → Settings → Environment Variables

2. Ensure variable is set

3. Check scope (RUN_TIME vs BUILD_TIME)

4. Redeploy app:
   Apps → Actions → Force Rebuild
```

### Problem: "Invalid API key"

**Solution**:
```bash
1. Verify key format:
   - OpenRouter: starts with sk-or-v1-
   - Google: long alphanumeric string

2. Test API key directly:
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://openrouter.ai/api/v1/models

3. Check for trailing spaces or newlines

4. Regenerate key if needed
```

### Problem: "Database connection failed"

**Solution**:
```bash
1. Verify DATABASE_URL format:
   postgresql://user:pass@host:port/database

2. Check database status:
   Databases → [Your DB] → Status

3. Verify connection from app console:
   Apps → Console
   psql $DATABASE_URL -c "SELECT 1"

4. Check connection pool settings
```

---

## Environment Variables Checklist

### Pre-Deployment

- [ ] Generated NEXTAUTH_SECRET
- [ ] Obtained OpenRouter API key
- [ ] Set up Google OAuth credentials (if needed)
- [ ] Documented all custom variables
- [ ] Tested locally with .env.local

### Deployment

- [ ] Set all required variables in Digital Ocean
- [ ] Verified variable scopes (RUN_TIME vs BUILD_TIME)
- [ ] Enabled auto-deploy on main branch
- [ ] Tested health check endpoint
- [ ] Verified database connection

### Post-Deployment

- [ ] Tested all features requiring API keys
- [ ] Verified authentication works
- [ ] Checked error logs for missing variables
- [ ] Set up monitoring/alerts
- [ ] Documented any custom configuration

---

## Quick Reference

### Minimum Required Setup

```bash
# Only these 4 variables are absolutely required:
DATABASE_URL=${db.DATABASE_URL}
NEXTAUTH_SECRET=<generate-with-openssl>
NEXTAUTH_URL=https://your-domain.com
OPENAI_API_KEY=sk-or-v1-xxx...
```

### Full Production Setup

```bash
# Complete production configuration:
DATABASE_URL=${db.DATABASE_URL}
NEXTAUTH_SECRET=<strong-secret>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
OPENAI_API_KEY=sk-or-v1-xxx...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-3.5-sonnet
NODE_ENV=production
TZ=Asia/Hong_Kong
```

---

## Additional Resources

- [Digital Ocean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Prisma Environment Variables](https://www.prisma.io/docs/guides/development-environment/environment-variables)

---

**Need help?** Check the [Migration Guide](./migrate-from-agency.md) or [Quick Reference](./QUICK_REFERENCE.md)
