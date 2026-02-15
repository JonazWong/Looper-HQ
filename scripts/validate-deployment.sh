#!/bin/bash
# =============================================================================
# Looper HQ - Pre-Deployment Validation Script
# =============================================================================
# This script validates that all required files and configurations are in place
# for successful deployment to Digital Ocean App Platform
#
# Usage: ./scripts/validate-deployment.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Looper HQ - Pre-Deployment Validation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $description: ${file}"
    else
        echo -e "${RED}❌${NC} $description: ${file} (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅${NC} $description: ${dir}"
    else
        echo -e "${RED}❌${NC} $description: ${dir} (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check command exists
check_command() {
    local cmd=$1
    local description=$2
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        echo -e "${GREEN}✅${NC} $description: $version"
    else
        echo -e "${YELLOW}⚠️${NC} $description: Not installed (optional for deployment)"
        WARNINGS=$((WARNINGS + 1))
    fi
}

echo "📋 Checking Required Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check deployment configuration files
check_file "Dockerfile" "Root Dockerfile"
check_file ".do/app.yaml" "Digital Ocean App Spec"
check_file ".github/workflows/deploy-production.yml" "GitHub Actions Workflow"
check_file ".env.production.example" "Production Environment Example"
check_file "docs/deployment-guide.md" "Deployment Guide"

echo ""
echo "📦 Checking Project Structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check directories
check_dir "apps/web" "Web Application"
check_dir "packages/database" "Database Package"
check_file "apps/web/package.json" "Web App package.json"
check_file "packages/database/prisma/schema.prisma" "Prisma Schema"

echo ""
echo "🔍 Validating Configuration Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Validate YAML syntax
if command -v python3 &> /dev/null; then
    if python3 -c "import yaml; yaml.safe_load(open('.do/app.yaml'))" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} app.yaml: Valid YAML syntax"
    else
        echo -e "${RED}❌${NC} app.yaml: Invalid YAML syntax"
        ERRORS=$((ERRORS + 1))
    fi
    
    if python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-production.yml'))" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} deploy-production.yml: Valid YAML syntax"
    else
        echo -e "${RED}❌${NC} deploy-production.yml: Invalid YAML syntax"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️${NC} Python3 not found - skipping YAML validation"
    WARNINGS=$((WARNINGS + 1))
fi

# Check Dockerfile structure
if grep -q "FROM node:20-alpine AS deps" Dockerfile; then
    echo -e "${GREEN}✅${NC} Dockerfile: Multi-stage build configured"
else
    echo -e "${RED}❌${NC} Dockerfile: Multi-stage build not found"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "HEALTHCHECK" Dockerfile; then
    echo -e "${GREEN}✅${NC} Dockerfile: Health check configured"
else
    echo -e "${YELLOW}⚠️${NC} Dockerfile: No health check found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check Next.js standalone output configuration
if [ -f "apps/web/next.config.js" ]; then
    if grep -q "output.*standalone" apps/web/next.config.js; then
        echo -e "${GREEN}✅${NC} Next.js: standalone output configured"
    else
        echo -e "${RED}❌${NC} Next.js: standalone output NOT configured"
        echo -e "${YELLOW}    Add 'output: \"standalone\"' to next.config.js${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check for port consistency between Dockerfile and app.yaml
DOCKERFILE_PORT=$(grep -oP 'EXPOSE \K[0-9]+' Dockerfile | head -1)
APPYAML_PORT=$(grep -oP 'http_port: \K[0-9]+' .do/app.yaml | head -1)

if [ "$DOCKERFILE_PORT" = "$APPYAML_PORT" ]; then
    echo -e "${GREEN}✅${NC} Port configuration: Dockerfile ($DOCKERFILE_PORT) matches app.yaml ($APPYAML_PORT)"
else
    echo -e "${RED}❌${NC} Port mismatch: Dockerfile exposes $DOCKERFILE_PORT but app.yaml expects $APPYAML_PORT"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "🔧 Checking Required Tools..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_command "node" "Node.js"
check_command "pnpm" "pnpm"
check_command "docker" "Docker"
check_command "doctl" "Digital Ocean CLI"

echo ""
echo "📝 Checking Package Scripts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check package.json scripts
if [ -f "apps/web/package.json" ]; then
    if grep -q '"build"' apps/web/package.json; then
        echo -e "${GREEN}✅${NC} Web app: build script exists"
    else
        echo -e "${RED}❌${NC} Web app: build script missing"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q '"start"' apps/web/package.json; then
        echo -e "${GREEN}✅${NC} Web app: start script exists"
    else
        echo -e "${RED}❌${NC} Web app: start script missing"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ -f "packages/database/package.json" ]; then
    if grep -q '"prisma"' packages/database/package.json; then
        echo -e "${GREEN}✅${NC} Database: Prisma installed"
    else
        echo -e "${RED}❌${NC} Database: Prisma not found"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "🔐 Checking Environment Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check .do/app.yaml for required environment variables
if grep -q "NEXTAUTH_SECRET" .do/app.yaml; then
    echo -e "${GREEN}✅${NC} app.yaml: NEXTAUTH_SECRET configured"
else
    echo -e "${YELLOW}⚠️${NC} app.yaml: NEXTAUTH_SECRET not found"
    WARNINGS=$((WARNINGS + 1))
fi

if grep -q "DATABASE_URL" .do/app.yaml; then
    echo -e "${GREEN}✅${NC} app.yaml: DATABASE_URL configured"
else
    echo -e "${RED}❌${NC} app.yaml: DATABASE_URL not found"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "OPENAI_API_KEY" .do/app.yaml; then
    echo -e "${GREEN}✅${NC} app.yaml: OPENAI_API_KEY configured"
else
    echo -e "${YELLOW}⚠️${NC} app.yaml: OPENAI_API_KEY not found (AI features may not work)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for database configuration
if grep -q "databases:" .do/app.yaml; then
    echo -e "${GREEN}✅${NC} app.yaml: Database service configured"
else
    echo -e "${RED}❌${NC} app.yaml: Database service not configured"
    ERRORS=$((ERRORS + 1))
fi

# Check for pre-deploy migration job
if grep -q "kind: PRE_DEPLOY" .do/app.yaml; then
    echo -e "${GREEN}✅${NC} app.yaml: Pre-deploy migration job configured"
else
    echo -e "${YELLOW}⚠️${NC} app.yaml: No pre-deploy migration job (migrations must be run manually)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "🏥 Checking Health Check Endpoint..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "apps/web/app/api/health/route.ts" ]; then
    echo -e "${GREEN}✅${NC} Health check endpoint exists: /api/health"
else
    echo -e "${RED}❌${NC} Health check endpoint missing: /api/health"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "http_path: /api/health" .do/app.yaml; then
    echo -e "${GREEN}✅${NC} Health check configured in app.yaml"
else
    echo -e "${YELLOW}⚠️${NC} Health check path not configured in app.yaml"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✨ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review docs/deployment-guide.md"
    echo "2. Set up Digital Ocean App Platform"
    echo "3. Configure GitHub Secrets (DIGITALOCEAN_ACCESS_TOKEN, DIGITALOCEAN_APP_ID)"
    echo "4. Set required secrets in DO Console (NEXTAUTH_SECRET, OPENAI_API_KEY)"
    echo "5. Push to main branch to trigger deployment"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validation completed with ${WARNINGS} warning(s).${NC}"
    echo "Review warnings above. You can proceed with deployment, but some features may not work."
    exit 0
else
    echo -e "${RED}❌ Validation failed with ${ERRORS} error(s) and ${WARNINGS} warning(s).${NC}"
    echo "Please fix the errors above before deploying."
    exit 1
fi
