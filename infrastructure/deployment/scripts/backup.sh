#!/bin/bash
set -e

################################################################################
# Looper HQ - Database Backup Script
# Creates compressed PostgreSQL database backups
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/opt/backups/looper-hq"
COMPOSE_FILE="/opt/looper-hq/infrastructure/deployment/docker/docker-compose.prod.yml"
RETENTION_DAYS=7

# Load environment variables
if [ -f "/opt/looper-hq/.env.production" ]; then
    export $(cat /opt/looper-hq/.env.production | grep -v '^#' | xargs)
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/looper-hq-$TIMESTAMP.sql"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

echo -e "${GREEN}🔄 Starting database backup...${NC}"
echo "Backup file: $BACKUP_FILE_GZ"

# Create database dump
if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-looper_hq}" > "$BACKUP_FILE"; then
    # Compress the backup
    gzip "$BACKUP_FILE"
    
    # Get file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
    
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo "File: $BACKUP_FILE_GZ"
    echo "Size: $BACKUP_SIZE"
    
    # Cleanup old backups
    echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last ${RETENTION_DAYS} days)...${NC}"
    find "$BACKUP_DIR" -name "looper-hq-*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Count remaining backups
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "looper-hq-*.sql.gz" -type f | wc -l)
    echo -e "${GREEN}Total backups: $BACKUP_COUNT${NC}"
    
    # Optional: Upload to DigitalOcean Spaces or S3
    # Uncomment and configure if you want remote backups
    # if [ ! -z "$BACKUP_S3_BUCKET" ]; then
    #     echo "Uploading to S3..."
    #     aws s3 cp "$BACKUP_FILE_GZ" "s3://$BACKUP_S3_BUCKET/backups/"
    # fi
    
    exit 0
else
    echo -e "${RED}❌ Backup failed!${NC}"
    rm -f "$BACKUP_FILE" "$BACKUP_FILE_GZ"
    exit 1
fi
