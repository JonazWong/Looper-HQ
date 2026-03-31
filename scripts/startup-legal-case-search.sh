#!/bin/sh
# Legal Case Search Production Startup Script
# Database schema sync is handled by the PRE_DEPLOY job in .do/app.yaml

set -e

echo "🚀 Starting Legal Case Search..."

echo "🌐 Starting Legal Case Search server on port ${PORT:-3001}..."
exec node apps/legal-case-search/server.js
