#!/usr/bin/env bash
# =============================================================================
# Looper HQ - Docker Setup Verification Script
# =============================================================================
# Verifies Docker configuration and prerequisites

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; ((ERRORS++)); }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; ((WARNINGS++)); }

echo "=============================================="
echo "  Looper HQ Docker Setup Verification"
echo "=============================================="
echo ""

# Check Docker
log_info "Checking Docker..."
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
  log_success "Docker installed: $DOCKER_VERSION"
  
  if docker info > /dev/null 2>&1; then
    log_success "Docker daemon is running"
  else
    log_error "Docker daemon is not running"
  fi
else
  log_error "Docker is not installed"
fi

# Check Docker Compose
log_info "Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
  COMPOSE_VERSION=$(docker-compose --version | awk '{print $4}' | sed 's/,//')
  log_success "Docker Compose installed: $COMPOSE_VERSION"
elif docker compose version &> /dev/null 2>&1; then
  COMPOSE_VERSION=$(docker compose version --short)
  log_success "Docker Compose plugin installed: $COMPOSE_VERSION"
else
  log_error "Docker Compose is not available"
fi

# Check required files
log_info "Checking required files..."
FILES=(
  "Dockerfile"
  "docker-compose.yml"
  "docker-compose.dev.yml"
  "docker-compose.prod.yml"
  ".dockerignore"
  "package.json"
  "pnpm-workspace.yaml"
  "turbo.json"
)

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    log_success "$file exists"
  else
    log_error "$file is missing"
  fi
done

# Check scripts
log_info "Checking build scripts..."
SCRIPTS=(
  "scripts/docker-build.sh"
  "scripts/docker-build.bat"
  "scripts/docker-quickstart.sh"
  "scripts/docker-quickstart.bat"
)

for script in "${SCRIPTS[@]}"; do
  if [[ -f "$script" ]]; then
    log_success "$script exists"
    if [[ "$script" == *.sh ]] && [[ ! -x "$script" ]]; then
      log_warning "$script is not executable (run: chmod +x $script)"
    fi
  else
    log_error "$script is missing"
  fi
done

# Check documentation
log_info "Checking documentation..."
DOCS=(
  "DOCKER.md"
  "DOCKER_SETUP.md"
)

for doc in "${DOCS[@]}"; do
  if [[ -f "$doc" ]]; then
    log_success "$doc exists"
  else
    log_warning "$doc is missing"
  fi
done

# Check directory structure
log_info "Checking directory structure..."
DIRS=(
  "apps/web"
  "apps/legal-case-search"
  "packages/database"
  "packages/utils"
  "infrastructure/docker"
)

for dir in "${DIRS[@]}"; do
  if [[ -d "$dir" ]]; then
    log_success "$dir exists"
  else
    log_error "$dir is missing"
  fi
done

# Check environment file
log_info "Checking environment configuration..."
if [[ -f ".env" ]]; then
  log_success ".env file exists"
  
  # Check critical variables
  if grep -q "NEXTAUTH_SECRET=" .env && ! grep -q "NEXTAUTH_SECRET=\"\"" .env; then
    log_success "NEXTAUTH_SECRET is set"
  else
    log_warning "NEXTAUTH_SECRET needs to be configured"
  fi
  
  if grep -q "DATABASE_URL=" .env; then
    log_success "DATABASE_URL is set"
  else
    log_warning "DATABASE_URL needs to be configured"
  fi
else
  log_warning ".env file not found (copy from .env.example)"
fi

# Validate docker-compose configuration
log_info "Validating docker-compose configuration..."
if command -v docker-compose &> /dev/null; then
  if docker-compose -f docker-compose.yml config --quiet 2>&1 | grep -q "error"; then
    log_error "docker-compose.yml has configuration errors"
  else
    log_success "docker-compose.yml is valid"
  fi
elif docker compose version &> /dev/null 2>&1; then
  if docker compose -f docker-compose.yml config --quiet 2>&1 | grep -q "error"; then
    log_error "docker-compose.yml has configuration errors"
  else
    log_success "docker-compose.yml is valid"
  fi
fi

# Check system resources
log_info "Checking system resources..."
if [[ -f /proc/meminfo ]]; then
  TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print int($2/1024/1024)}')
  if [[ $TOTAL_MEM -ge 8 ]]; then
    log_success "System RAM: ${TOTAL_MEM}GB (sufficient)"
  else
    log_warning "System RAM: ${TOTAL_MEM}GB (8GB+ recommended)"
  fi
elif command -v sysctl &> /dev/null; then
  TOTAL_MEM=$(sysctl -n hw.memsize 2>/dev/null | awk '{print int($1/1024/1024/1024)}' || echo "unknown")
  if [[ "$TOTAL_MEM" != "unknown" ]] && [[ $TOTAL_MEM -ge 8 ]]; then
    log_success "System RAM: ${TOTAL_MEM}GB (sufficient)"
  else
    log_warning "System RAM: ${TOTAL_MEM}GB (8GB+ recommended)"
  fi
else
  log_info "System RAM: Unable to detect"
fi

# Check disk space
log_info "Checking disk space..."
AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
log_info "Available disk space: $AVAILABLE_SPACE"

# Summary
echo ""
echo "=============================================="
if [[ $ERRORS -eq 0 ]] && [[ $WARNINGS -eq 0 ]]; then
  log_success "All checks passed! You're ready to start."
  echo ""
  echo "Next steps:"
  echo "  1. Review/update .env file if needed"
  echo "  2. Run: ./scripts/docker-quickstart.sh"
  echo "  3. Or use: make dev"
elif [[ $ERRORS -eq 0 ]]; then
  log_warning "Setup complete with $WARNINGS warning(s)"
  echo ""
  echo "Please address warnings before proceeding."
else
  log_error "Setup incomplete: $ERRORS error(s), $WARNINGS warning(s)"
  echo ""
  echo "Please fix errors before proceeding."
  exit 1
fi
echo "=============================================="
