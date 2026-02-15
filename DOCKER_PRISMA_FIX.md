# Quick Reference: Prisma Client Docker Fix

## What Was Fixed

Fixed critical Docker build failure where Prisma client was not being properly generated, causing the error:
```
lstat /kaniko/1/app/node_modules/.prisma: no such file or directory
```

## Key Changes

### 1. Deps Stage - Line 36-41
**Added explicit Prisma generation:**
```dockerfile
RUN pnpm --filter=@looper-hq/database prisma generate
RUN ls -la /app/node_modules/.prisma/client || echo "Warning: .prisma/client not found after generation"
```

### 2. Runner Stage - Line 110-113
**Changed copy source from builder to deps:**
```dockerfile
# Before:
COPY --from=builder ...

# After:
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
```

### 3. Runner Stage - Line 124-131
**Added fallback generation:**
```dockerfile
RUN if [ ! -d "./node_modules/.prisma/client" ]; then \
      echo "⚠️  Prisma client not found, generating at runtime..."; \
      pnpm --filter=@looper-hq/database prisma generate; \
    else \
      echo "✅ Prisma client found, skipping runtime generation"; \
    fi
```

## How to Test

### Local Testing
```bash
# Run validation script
./scripts/validate-docker-prisma.sh

# Or manually:
docker build -t looper-hq-test:latest . --progress=plain
docker run --rm looper-hq-test:latest ls -la /app/node_modules/.prisma/client
```

### What to Look For
✅ Build completes without errors
✅ "✅ Prisma client found, skipping runtime generation" in build log
✅ `.prisma/client` directory exists with `index.js`
✅ `@prisma/client` package exists

### Warning Signs
⚠️ "⚠️ Prisma client not found, generating at runtime" - deps copy failed
❌ Build fails at runner stage - fallback also failed

## Why This Works

1. **Deps Stage**: Generates Prisma client once during dependency installation
2. **Runner Stage**: Copies pre-generated client from deps (reliable source)
3. **Fallback**: If copy fails, generates at runtime (safety net)

## Related Files

- `/Dockerfile` - Main configuration
- `/packages/database/prisma/schema.prisma` - Prisma schema
- `/package.json` - Root package with postinstall hook
- `/packages/database/package.json` - Database package config

## Troubleshooting

### If build still fails:

1. **Check deps stage logs:**
   ```bash
   docker build --target deps -t test-deps . --progress=plain 2>&1 | grep prisma
   ```

2. **Verify schema exists:**
   ```bash
   ls -la packages/database/prisma/schema.prisma
   ```

3. **Check pnpm version:**
   ```bash
   # Should be 9.15.2 in deps and builder stages
   grep "pnpm@" Dockerfile
   ```

4. **Manual test of generation:**
   ```bash
   pnpm install --frozen-lockfile
   pnpm --filter=@looper-hq/database prisma generate
   ls -la node_modules/.prisma/client
   ```

## Emergency Rollback

If this fix causes issues, revert to previous version:
```bash
git revert HEAD
git push
```

Previous behavior: Generated in builder, copied from builder to runner.
