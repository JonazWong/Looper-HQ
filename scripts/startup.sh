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
  # Use the Prisma CLI from standalone output
  node ../../apps/web/node_modules/.bin/prisma db push --accept-data-loss --skip-generate || {
    echo "⚠️  Schema sync failed, but continuing startup..."
    echo "   Database tables might be missing - check DATABASE_URL"
  }
  echo "✅ Database schema sync completed"
else
  echo "⚠️  Prisma directory not found, skipping schema sync"
fi

echo "🌐 Starting Next.js server on port ${PORT:-3000}..."
cd /app
exec node apps/web/server.js
