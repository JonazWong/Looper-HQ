#!/bin/bash

################################################################################
# Looper HQ - Health Check Script
# Validates application health for deployment automation
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://localhost:3005/api/health}"
MAX_RETRIES="${MAX_RETRIES:-5}"
RETRY_DELAY="${RETRY_DELAY:-5}"
TIMEOUT="${TIMEOUT:-10}"

# Function to check HTTP endpoint
check_http() {
    local url=$1
    local expected_status=${2:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# Main health check
echo "🏥 Running health checks..."
echo "Endpoint: $HEALTH_ENDPOINT"
echo ""

SUCCESS=false

for i in $(seq 1 "$MAX_RETRIES"); do
    echo "Attempt $i/$MAX_RETRIES..."
    
    # Check main health endpoint
    if check_http "$HEALTH_ENDPOINT" 200; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        SUCCESS=true
        break
    else
        if [ $i -lt "$MAX_RETRIES" ]; then
            echo -e "${YELLOW}⏳ Health check failed, retrying in ${RETRY_DELAY}s...${NC}"
            sleep "$RETRY_DELAY"
        fi
    fi
done

if [ "$SUCCESS" = true ]; then
    echo -e "${GREEN}✅ All health checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Health check failed after $MAX_RETRIES attempts!${NC}"
    exit 1
fi
