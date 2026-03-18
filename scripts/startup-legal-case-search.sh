#!/bin/sh
# Legal Case Search Production Startup Script
# Syncs database schema before starting Next.js server

set -e

echo "🚀 Starting Legal Case Search..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "✅ DATABASE_URL is configured"

# Sync database schema (using non-destructive db push since project doesn't use migrations)
echo "📊 Syncing database schema..."
if [ -d "/app/prisma" ]; then
  cd /app

  # Use pnpm dlx to execute prisma without installation
  # NOTE: Do NOT use --force-reset here; it drops all data and is unsafe for production.
  pnpm dlx prisma@5.17.0 db push --skip-generate --schema=./prisma/schema.prisma 2>&1 || {
    EXITCODE=$?
    echo "⚠️  Schema sync failed with exit code $EXITCODE"
    echo "   Continuing startup anyway - check DATABASE_URL and network connectivity"
  }

  echo "✅ Database schema sync completed"
else
  echo "⚠️  Prisma directory not found, skipping schema sync"
fi

echo "🌐 Starting Legal Case Search server on port ${PORT:-3001}..."
exec node apps/legal-case-search/server.js
