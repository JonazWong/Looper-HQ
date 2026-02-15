#!/bin/bash
# =============================================================================
# Looper HQ - Environment Variables Validation Script
# =============================================================================
# This script validates that all required environment variables are set
# for successful deployment and operation
#
# Usage: ./scripts/check-env.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Checking Required Environment Variables${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Required environment variables
REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
)

# Optional but recommended environment variables
OPTIONAL_VARS=(
  "OPENAI_API_KEY"
  "KEYCLOAK_CLIENT_ID"
  "KEYCLOAK_ISSUER"
  "CRAWLER_ENABLED"
  "NODE_ENV"
)

MISSING_VARS=()
MISSING_OPTIONAL=()

echo "📋 Required Variables:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
    echo -e "${RED}❌${NC} $var is not set"
  else
    # Don't expose the actual value for security
    echo -e "${GREEN}✅${NC} $var is set"
  fi
done

echo ""
echo "📋 Optional Variables:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for var in "${OPTIONAL_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_OPTIONAL+=("$var")
    echo -e "${YELLOW}⚠️${NC}  $var is not set (optional)"
  else
    echo -e "${GREEN}✅${NC} $var is set"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}❌ Missing ${#MISSING_VARS[@]} required environment variable(s):${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo -e "   - $var"
  done
  echo ""
  echo -e "${YELLOW}💡 How to set these variables:${NC}"
  echo ""
  echo "For local development:"
  echo "  1. Copy .env.example to .env"
  echo "  2. Fill in the required values"
  echo ""
  echo "For production (Digital Ocean):"
  echo "  1. Go to your app in DO Console"
  echo "  2. Navigate to Settings → App-Level Environment Variables"
  echo "  3. Add each missing variable"
  echo ""
  echo "Required values:"
  echo "  - DATABASE_URL: Auto-injected by DO database (use \${db.DATABASE_URL})"
  echo "  - NEXTAUTH_SECRET: Generate with: openssl rand -base64 32"
  echo "  - NEXTAUTH_URL: Your app URL (e.g., https://your-app.ondigitalocean.app)"
  echo ""
  exit 1
fi

if [ ${#MISSING_OPTIONAL[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  ${#MISSING_OPTIONAL[@]} optional variable(s) not set:${NC}"
  for var in "${MISSING_OPTIONAL[@]}"; do
    echo -e "   - $var"
  done
  echo ""
  echo -e "${BLUE}ℹ️  Note: The application will work without these, but some features may be disabled.${NC}"
  echo ""
  echo "Optional features:"
  echo "  - OPENAI_API_KEY: Required for AI-powered features"
  echo "  - KEYCLOAK_CLIENT_ID/ISSUER: Required for Keycloak OAuth authentication"
  echo "  - CRAWLER_ENABLED: Set to 'true' to enable automated case crawling"
  echo ""
fi

echo ""
echo -e "${GREEN}✅ All required environment variables are set${NC}"
echo ""
exit 0
