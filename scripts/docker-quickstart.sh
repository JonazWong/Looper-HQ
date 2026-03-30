#!/usr/bin/env bash
# =============================================================================
# Looper HQ - Docker Quick Start
# =============================================================================
# One-command setup for Docker development environment

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker Desktop."
    exit 1
  fi
  
  if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker Desktop."
    exit 1
  fi
  
  if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    log_error "Docker Compose is not available."
    exit 1
  fi
  
  log_success "All prerequisites met"
}

# Create .env if it doesn't exist
setup_env() {
  if [[ ! -f .env ]]; then
    log_info "Creating .env file from .env.example..."
    cp .env.example .env
    log_success "Created .env file - please review and update if needed"
  else
    log_info ".env file already exists"
  fi
}

# Start services
start_services() {
  local mode=$1
  
  if [[ "$mode" == "dev" ]]; then
    log_info "Starting infrastructure services only (databases, auth)..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
  else
    log_info "Building and starting all services..."
    docker-compose up -d --build
  fi
}

# Wait for services
wait_for_services() {
  log_info "Waiting for services to be healthy..."
  
  local max_attempts=30
  local attempt=0
  
  while [[ $attempt -lt $max_attempts ]]; do
    if docker-compose ps | grep -q "unhealthy"; then
      ((attempt++))
      echo -n "."
      sleep 2
    else
      echo ""
      log_success "All services are healthy"
      return 0
    fi
  done
  
  log_warning "Some services may not be fully ready yet"
  return 0
}

# Display service URLs
show_urls() {
  echo ""
  echo "=============================================="
  log_success "Looper HQ Docker Environment Ready!"
  echo "=============================================="
  echo ""
  echo "Services:"
  echo "  🗄️  PostgreSQL:     localhost:5433"
  echo "  🔴 Redis:           localhost:6380"
  echo "  🔐 Keycloak:        http://localhost:8080"
  echo ""
  
  if docker-compose ps | grep -q "looper-hq-web"; then
    echo "  🌐 Web App:         http://localhost:3005"
  fi
  
  if docker-compose ps | grep -q "looper-hq-legal"; then
    echo "  ⚖️  Legal Search:    http://localhost:3001"
  fi
  
  if docker-compose ps | grep -q "looper-hq-pgadmin"; then
    echo "  📊 pgAdmin:         http://localhost:5050"
  fi
  
  echo ""
  echo "Useful commands:"
  echo "  View logs:          docker-compose logs -f"
  echo "  Stop services:      docker-compose down"
  echo "  Restart:            docker-compose restart"
  echo ""
}

# Main menu
main() {
  echo "=============================================="
  echo "   Looper HQ Docker Quick Start"
  echo "=============================================="
  echo ""
  echo "Choose setup mode:"
  echo "  1) Development (infrastructure only)"
  echo "  2) Full stack (all services in Docker)"
  echo "  3) Exit"
  echo ""
  read -p "Enter choice [1-3]: " choice
  
  case $choice in
    1)
      check_prerequisites
      setup_env
      start_services "dev"
      wait_for_services
      show_urls
      echo "Next steps:"
      echo "  1. Run: pnpm install"
      echo "  2. Run: pnpm db:migrate"
      echo "  3. Run: pnpm dev"
      ;;
    2)
      check_prerequisites
      setup_env
      start_services "full"
      wait_for_services
      show_urls
      ;;
    3)
      log_info "Exiting..."
      exit 0
      ;;
    *)
      log_error "Invalid choice"
      exit 1
      ;;
  esac
}

main "$@"
