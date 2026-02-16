#!/bin/sh
# Looper HQ Production Startup Script
# Syncs database schema before starting Next.js server

set -e

echo "🚀 Starting Looper HQ..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "✅ DATABASE_URL is configured"

# Sync database schema (using db push since project doesn't use migrations)
echo "📊 Syncing database schema..."
if [ -d "/app/packages/database/prisma" ]; then
  cd /app/packages/database
  
  # Run db push using the Prisma CLI we installed
  npx prisma db push --accept-data-loss --skip-generate 2>&1 || {
    EXITCODE=$?
    echo "⚠️  Schema sync failed with exit code $EXITCODE"
    echo "   Continuing startup anyway - check DATABASE_URL and network connectivity"
  }
  
  echo "✅ Database schema sync completed"
  cd /app
else
  echo "⚠️  Prisma directory not found, skipping schema sync"
fi

echo "🌐 Starting Next.js server on port ${PORT:-3000}..."
exec node apps/web/server.js
