#!/bin/sh
# Looper HQ Production Startup Script
# Database schema sync is handled by the PRE_DEPLOY job in .do/app.yaml

set -e

echo "🚀 Starting Looper HQ..."

PORT="${PORT:-3005}"
export PORT

echo "🌐 Starting Next.js server on port ${PORT}..."
exec node apps/web/server.js
