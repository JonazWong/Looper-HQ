#!/bin/bash
set -e

################################################################################
# Looper HQ - Database Restore Script
# Restores PostgreSQL database from backup
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/opt/backups/looper-hq"
COMPOSE_FILE="/opt/looper-hq/infrastructure/deployment/docker/docker-compose.prod.yml"
TMP_DIR="/tmp/looper-hq-restore"

# Load environment variables
if [ -f "/opt/looper-hq/.env.production" ]; then
    export $(cat /opt/looper-hq/.env.production | grep -v '^#' | xargs)
fi

# Function to list available backups
list_backups() {
    echo -e "${GREEN}Available backups:${NC}"
    ls -lht "$BACKUP_DIR"/looper-hq-*.sql.gz 2>/dev/null | head -10 || echo "No backups found"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <backup-file|latest>${NC}"
    echo ""
    list_backups
    exit 1
fi

# Determine backup file
if [ "$1" = "latest" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/looper-hq-*.sql.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}No backup files found!${NC}"
        exit 1
    fi
    echo -e "${GREEN}Using latest backup: $BACKUP_FILE${NC}"
else
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}Backup file not found: $BACKUP_FILE${NC}"
        list_backups
        exit 1
    fi
fi

# Confirm restore
echo -e "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

echo -e "${GREEN}🔄 Starting database restore...${NC}"

# Create temporary directory
mkdir -p "$TMP_DIR"

# Decompress backup to temporary file
echo "Decompressing backup..."
TMP_SQL="$TMP_DIR/restore.sql"
gunzip -c "$BACKUP_FILE" > "$TMP_SQL"

# Stop the web application to prevent connections
echo "Stopping web application..."
docker compose -f "$COMPOSE_FILE" stop web

# Drop and recreate database
echo "Dropping existing database..."
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${POSTGRES_USER:-postgres}" -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-looper_hq};"
echo "Creating fresh database..."
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${POSTGRES_USER:-postgres}" -c "CREATE DATABASE ${POSTGRES_DB:-looper_hq};"

# Restore database
echo "Restoring database..."
if docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-looper_hq}" < "$TMP_SQL"; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
    
    # Cleanup temporary files
    rm -rf "$TMP_DIR"
    
    # Restart web application
    echo "Restarting web application..."
    docker compose -f "$COMPOSE_FILE" start web
    
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Restore failed!${NC}"
    rm -rf "$TMP_DIR"
    
    # Try to restart web application anyway
    docker compose -f "$COMPOSE_FILE" start web
    exit 1
fi
