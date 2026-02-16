# =============================================================================
# Looper HQ - Docker Operations Makefile
# =============================================================================
# Convenient shortcuts for Docker operations
#
# Usage: make <target>

.PHONY: help build up down restart logs clean dev prod test

# Default target
.DEFAULT_GOAL := help

# Colors
COLOR_RESET   = \033[0m
COLOR_INFO    = \033[36m
COLOR_SUCCESS = \033[32m

# Configuration
COMPOSE_DEV = docker-compose.yml docker-compose.dev.yml
COMPOSE_PROD = docker-compose.yml docker-compose.prod.yml
COMPOSE = docker-compose

## help: Show this help message
help:
	@echo ""
	@echo "$(COLOR_INFO)Looper HQ Docker Operations$(COLOR_RESET)"
	@echo ""
	@echo "Available targets:"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /' | column -t -s ':'
	@echo ""

## build: Build all Docker images
build:
	@echo "$(COLOR_INFO)Building Docker images...$(COLOR_RESET)"
	@./scripts/docker-build.sh

## build-no-cache: Build all Docker images without cache
build-no-cache:
	@echo "$(COLOR_INFO)Building Docker images (no cache)...$(COLOR_RESET)"
	@./scripts/docker-build.sh --no-cache

## dev: Start development environment (infrastructure only)
dev:
	@echo "$(COLOR_INFO)Starting development environment...$(COLOR_RESET)"
	@$(COMPOSE) -f $(COMPOSE_DEV) up -d
	@echo "$(COLOR_SUCCESS)✓ Development environment started$(COLOR_RESET)"
	@echo ""
	@echo "Services:"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis:      localhost:6379"
	@echo "  Keycloak:   http://localhost:8080"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Run: pnpm install"
	@echo "  2. Run: pnpm db:migrate"
	@echo "  3. Run: pnpm dev"

## up: Start all services (full stack)
up:
	@echo "$(COLOR_INFO)Starting all services...$(COLOR_RESET)"
	@$(COMPOSE) up -d
	@echo "$(COLOR_SUCCESS)✓ All services started$(COLOR_RESET)"

## up-build: Start all services with rebuild
up-build:
	@echo "$(COLOR_INFO)Building and starting all services...$(COLOR_RESET)"
	@$(COMPOSE) up -d --build
	@echo "$(COLOR_SUCCESS)✓ All services built and started$(COLOR_RESET)"

## prod: Start production environment
prod:
	@echo "$(COLOR_INFO)Starting production environment...$(COLOR_RESET)"
	@$(COMPOSE) -f $(COMPOSE_PROD) up -d
	@echo "$(COLOR_SUCCESS)✓ Production environment started$(COLOR_RESET)"

## down: Stop all services
down:
	@echo "$(COLOR_INFO)Stopping all services...$(COLOR_RESET)"
	@$(COMPOSE) down
	@echo "$(COLOR_SUCCESS)✓ All services stopped$(COLOR_RESET)"

## down-volumes: Stop all services and remove volumes
down-volumes:
	@echo "$(COLOR_INFO)Stopping all services and removing volumes...$(COLOR_RESET)"
	@$(COMPOSE) down -v
	@echo "$(COLOR_SUCCESS)✓ All services stopped and volumes removed$(COLOR_RESET)"

## restart: Restart all services
restart:
	@echo "$(COLOR_INFO)Restarting all services...$(COLOR_RESET)"
	@$(COMPOSE) restart
	@echo "$(COLOR_SUCCESS)✓ All services restarted$(COLOR_RESET)"

## restart-web: Restart web application
restart-web:
	@echo "$(COLOR_INFO)Restarting web application...$(COLOR_RESET)"
	@$(COMPOSE) restart web
	@echo "$(COLOR_SUCCESS)✓ Web application restarted$(COLOR_RESET)"

## restart-legal: Restart legal case search application
restart-legal:
	@echo "$(COLOR_INFO)Restarting legal case search application...$(COLOR_RESET)"
	@$(COMPOSE) restart legal
	@echo "$(COLOR_SUCCESS)✓ Legal case search application restarted$(COLOR_RESET)"

## logs: Show logs for all services
logs:
	@$(COMPOSE) logs -f

## logs-web: Show logs for web application
logs-web:
	@$(COMPOSE) logs -f web

## logs-legal: Show logs for legal case search application
logs-legal:
	@$(COMPOSE) logs -f legal

## logs-db: Show logs for database
logs-db:
	@$(COMPOSE) logs -f postgres

## ps: List all running services
ps:
	@$(COMPOSE) ps

## status: Show detailed status of all services
status:
	@echo "$(COLOR_INFO)Service Status:$(COLOR_RESET)"
	@echo ""
	@$(COMPOSE) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

## clean: Remove all stopped containers, unused networks, and dangling images
clean:
	@echo "$(COLOR_INFO)Cleaning Docker resources...$(COLOR_RESET)"
	@$(COMPOSE) down
	@docker system prune -f
	@echo "$(COLOR_SUCCESS)✓ Cleanup complete$(COLOR_RESET)"

## clean-all: Remove all Docker resources including volumes and images
clean-all:
	@echo "$(COLOR_INFO)Removing all Docker resources...$(COLOR_RESET)"
	@$(COMPOSE) down -v --rmi all
	@docker system prune -af --volumes
	@echo "$(COLOR_SUCCESS)✓ All Docker resources removed$(COLOR_RESET)"

## db-migrate: Run database migrations
db-migrate:
	@echo "$(COLOR_INFO)Running database migrations...$(COLOR_RESET)"
	@$(COMPOSE) exec web pnpm db:migrate
	@echo "$(COLOR_SUCCESS)✓ Migrations complete$(COLOR_RESET)"

## db-seed: Seed database with initial data
db-seed:
	@echo "$(COLOR_INFO)Seeding database...$(COLOR_RESET)"
	@$(COMPOSE) exec web pnpm db:seed
	@echo "$(COLOR_SUCCESS)✓ Database seeded$(COLOR_RESET)"

## db-shell: Open PostgreSQL shell
db-shell:
	@$(COMPOSE) exec postgres psql -U postgres -d looper_hq

## redis-cli: Open Redis CLI
redis-cli:
	@$(COMPOSE) exec redis redis-cli

## shell-web: Open shell in web container
shell-web:
	@$(COMPOSE) exec web sh

## shell-legal: Open shell in legal container
shell-legal:
	@$(COMPOSE) exec legal sh

## test: Run tests in containers
test:
	@echo "$(COLOR_INFO)Running tests...$(COLOR_RESET)"
	@$(COMPOSE) exec web pnpm test

## health: Check health status of all services
health:
	@echo "$(COLOR_INFO)Health Status:$(COLOR_RESET)"
	@echo ""
	@$(COMPOSE) ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"

## images: List all Looper HQ Docker images
images:
	@docker images "looper-hq/*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}"

## quickstart: Interactive quick start script
quickstart:
	@./scripts/docker-quickstart.sh
