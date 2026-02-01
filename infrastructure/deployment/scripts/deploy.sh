#!/bin/bash
set -e

################################################################################
# Looper HQ - Zero-Downtime Deployment Script
# Performs rolling updates with automatic rollback on failure
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/looper-hq"
COMPOSE_FILE="infrastructure/deployment/docker/docker-compose.prod.yml"
BACKUP_DIR="/opt/backups/looper-hq"
LOG_FILE="/var/log/looper-hq/deploy.log"
MAX_HEALTH_RETRIES=5
HEALTH_RETRY_DELAY=10

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running in app directory
if [ ! -d "$APP_DIR" ]; then
    error "Application directory $APP_DIR not found!"
    exit 1
fi

cd "$APP_DIR"

log "🚀 Starting Looper HQ deployment..."

# Step 1: Pull latest code
log "[1/9] Pulling latest code from git..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_COMMIT=$(git rev-parse HEAD)
log "Current branch: $CURRENT_BRANCH"
log "Current commit: $CURRENT_COMMIT"

git pull origin "$CURRENT_BRANCH"
NEW_COMMIT=$(git rev-parse HEAD)
log "New commit: $NEW_COMMIT"

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    warning "No new changes detected. Continuing anyway..."
fi

# Step 2: Create database backup
log "[2/9] Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql.gz"
mkdir -p "$BACKUP_DIR"

if ./infrastructure/deployment/scripts/backup.sh; then
    log "✅ Database backup created successfully"
else
    error "Failed to create database backup!"
    exit 1
fi

# Step 3: Build Docker images
log "[3/9] Building Docker images..."
if docker compose -f "$COMPOSE_FILE" build web; then
    log "✅ Docker images built successfully"
else
    error "Failed to build Docker images!"
    exit 1
fi

# Step 4: Run database migrations
log "[4/9] Running Prisma migrations..."
if docker compose -f "$COMPOSE_FILE" run --rm web sh -c "cd packages/database && npx prisma migrate deploy"; then
    log "✅ Database migrations completed"
else
    error "Failed to run migrations!"
    log "Rolling back to previous commit..."
    git reset --hard "$CURRENT_COMMIT"
    exit 1
fi

# Step 5: Perform rolling update
log "[5/9] Performing rolling update..."
if docker compose -f "$COMPOSE_FILE" up -d --no-deps --build web; then
    log "✅ Containers updated successfully"
else
    error "Failed to update containers!"
    log "Rolling back..."
    git reset --hard "$CURRENT_COMMIT"
    docker compose -f "$COMPOSE_FILE" up -d --no-deps web
    exit 1
fi

# Step 6: Wait for services to be ready
log "[6/9] Waiting for services to be ready..."
sleep 10

# Step 7: Health check
log "[7/9] Running health checks..."
HEALTH_CHECK_PASSED=false

for i in $(seq 1 $MAX_HEALTH_RETRIES); do
    log "Health check attempt $i/$MAX_HEALTH_RETRIES..."
    
    if ./infrastructure/deployment/scripts/health-check.sh; then
        HEALTH_CHECK_PASSED=true
        log "✅ Health check passed!"
        break
    else
        warning "Health check failed, retrying in ${HEALTH_RETRY_DELAY}s..."
        sleep $HEALTH_RETRY_DELAY
    fi
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
    error "Health check failed after $MAX_HEALTH_RETRIES attempts!"
    log "Rolling back deployment..."
    
    # Rollback to previous commit
    git reset --hard "$CURRENT_COMMIT"
    docker compose -f "$COMPOSE_FILE" up -d --no-deps web
    
    error "Deployment failed and rolled back!"
    exit 1
fi

# Step 8: Cleanup old images
log "[8/9] Cleaning up old Docker images..."
docker image prune -f --filter "until=24h" || true

# Step 9: Log deployment success
log "[9/9] Deployment completed successfully! 🎉"
log "Deployed commit: $NEW_COMMIT"
log "Deployment time: $(date)"

# Display running containers
log "Running containers:"
docker compose -f "$COMPOSE_FILE" ps

echo ""
log "✅ Deployment completed successfully!"
echo ""
