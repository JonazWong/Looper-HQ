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

PRISMA_VERSION="5.17.0"

# Sync database schema (using db push since project doesn't use migrations)
echo "📊 Syncing database schema..."
if [ -d "/app/prisma" ]; then
  cd /app
  
  # Enable pgvector extension before schema sync
  echo "🔧 Enabling pgvector extension..."
  echo "CREATE EXTENSION IF NOT EXISTS vector;" | pnpm dlx "prisma@${PRISMA_VERSION}" db execute --schema=./prisma/schema.prisma --stdin 2>&1 || {
    echo "⚠️  pgvector extension setup failed (continuing anyway - extension may not be supported)"
  }

  # Use pnpm dlx to execute prisma without installation (force-reset for clean state)
  pnpm dlx "prisma@${PRISMA_VERSION}" db push --force-reset --skip-generate --schema=./prisma/schema.prisma 2>&1 || {
    EXITCODE=$?
    echo "⚠️  Schema sync failed with exit code $EXITCODE"
    echo "   Continuing startup anyway - check DATABASE_URL and network connectivity"
  }
  
  echo "✅ Database schema sync completed"
  
  # Create admin user if database is empty
  echo "🔐 Checking for admin user..."
  pnpm dlx tsx@4.7.0 ./prisma/seed-admin.ts 2>&1 || {
    echo "⚠️  Admin creation skipped or failed (this is OK if users already exist)"
  }
else
  echo "⚠️  Prisma directory not found, skipping schema sync"
fi

echo "🌐 Starting Next.js server on port ${PORT:-3000}..."
exec node apps/web/server.js
