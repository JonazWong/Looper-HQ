#!/bin/bash
# Validation script for Prisma Client generation in Docker build
# This script tests the Docker build and verifies Prisma client is correctly generated

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

IMAGE_NAME="looper-hq-test:latest"
BUILD_LOG="/tmp/docker-build-prisma-test.log"

echo -e "${BLUE}=================================================================${NC}"
echo -e "${BLUE}  Looper HQ - Prisma Client Generation Validation${NC}"
echo -e "${BLUE}=================================================================${NC}"
echo ""

# Step 1: Build the Docker image
echo -e "${YELLOW}Step 1: Building Docker image with detailed output...${NC}"
echo -e "Build log will be saved to: ${BUILD_LOG}"
echo ""

if docker build -t "${IMAGE_NAME}" . --progress=plain > "${BUILD_LOG}" 2>&1; then
    echo -e "${GREEN}✅ Docker build SUCCEEDED${NC}"
else
    echo -e "${RED}❌ Docker build FAILED${NC}"
    echo -e "Check ${BUILD_LOG} for details"
    echo ""
    echo -e "${YELLOW}Last 50 lines of build log:${NC}"
    tail -50 "${BUILD_LOG}"
    exit 1
fi

echo ""
echo -e "${BLUE}=================================================================${NC}"
echo -e "${YELLOW}Step 2: Verifying Prisma client in deps stage output...${NC}"
echo -e "${BLUE}=================================================================${NC}"
echo ""

# Check build log for successful generation in deps stage
if grep -q "Prisma client found" "${BUILD_LOG}"; then
    echo -e "${GREEN}✅ Build log shows Prisma client generation verification${NC}"
else
    echo -e "${YELLOW}⚠️  Build log doesn't show explicit verification message${NC}"
fi

echo ""
echo -e "${BLUE}=================================================================${NC}"
echo -e "${YELLOW}Step 3: Verifying Prisma client in built image...${NC}"
echo -e "${BLUE}=================================================================${NC}"
echo ""

# Test 1: Check .prisma/client directory
echo -e "${YELLOW}Test 3.1: Checking /app/node_modules/.prisma/client directory...${NC}"
if docker run --rm "${IMAGE_NAME}" ls -la /app/node_modules/.prisma/client >/dev/null 2>&1; then
    echo -e "${GREEN}✅ .prisma/client directory exists${NC}"
    docker run --rm "${IMAGE_NAME}" ls -lh /app/node_modules/.prisma/client | head -5
else
    echo -e "${RED}❌ .prisma/client directory NOT found${NC}"
    exit 1
fi

echo ""

# Test 2: Check @prisma/client package
echo -e "${YELLOW}Test 3.2: Checking /app/node_modules/@prisma/client directory...${NC}"
if docker run --rm "${IMAGE_NAME}" ls -la /app/node_modules/@prisma/client >/dev/null 2>&1; then
    echo -e "${GREEN}✅ @prisma/client package exists${NC}"
    docker run --rm "${IMAGE_NAME}" ls -lh /app/node_modules/@prisma/client | head -5
else
    echo -e "${RED}❌ @prisma/client package NOT found${NC}"
    exit 1
fi

echo ""

# Test 3: Check Prisma schema
echo -e "${YELLOW}Test 3.3: Checking Prisma schema location...${NC}"
if docker run --rm "${IMAGE_NAME}" ls -la /app/packages/database/prisma/schema.prisma >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma schema exists${NC}"
    docker run --rm "${IMAGE_NAME}" ls -lh /app/packages/database/prisma/schema.prisma
else
    echo -e "${RED}❌ Prisma schema NOT found${NC}"
    exit 1
fi

echo ""

# Test 4: Check for index.js in Prisma client (actual generated code)
echo -e "${YELLOW}Test 3.4: Verifying Prisma client code generation...${NC}"
if docker run --rm "${IMAGE_NAME}" test -f /app/node_modules/.prisma/client/index.js; then
    echo -e "${GREEN}✅ Prisma client index.js exists (code was generated)${NC}"
else
    echo -e "${RED}❌ Prisma client code was NOT generated${NC}"
    exit 1
fi

echo ""

# Test 5: Check workspace configuration
echo -e "${YELLOW}Test 3.5: Checking workspace configuration...${NC}"
if docker run --rm "${IMAGE_NAME}" ls -la /app/pnpm-workspace.yaml >/dev/null 2>&1; then
    echo -e "${GREEN}✅ pnpm-workspace.yaml exists${NC}"
else
    echo -e "${YELLOW}⚠️  pnpm-workspace.yaml NOT found (may cause issues with migrations)${NC}"
fi

echo ""
echo -e "${BLUE}=================================================================${NC}"
echo -e "${YELLOW}Step 4: Checking for fallback generation messages...${NC}"
echo -e "${BLUE}=================================================================${NC}"
echo ""

if grep -q "✅ Prisma client found, skipping runtime generation" "${BUILD_LOG}"; then
    echo -e "${GREEN}✅ Fallback check confirmed Prisma client was present${NC}"
elif grep -q "⚠️  Prisma client not found, generating at runtime" "${BUILD_LOG}"; then
    echo -e "${YELLOW}⚠️  Fallback generation was triggered (deps copy may have failed)${NC}"
else
    echo -e "${YELLOW}⚠️  No fallback check message found in build log${NC}"
fi

echo ""
echo -e "${BLUE}=================================================================${NC}"
echo -e "${GREEN}  ✅ ALL VALIDATION TESTS PASSED${NC}"
echo -e "${BLUE}=================================================================${NC}"
echo ""
echo -e "Summary:"
echo -e "  • Docker build: ${GREEN}SUCCESS${NC}"
echo -e "  • .prisma/client directory: ${GREEN}FOUND${NC}"
echo -e "  • @prisma/client package: ${GREEN}FOUND${NC}"
echo -e "  • Prisma schema: ${GREEN}FOUND${NC}"
echo -e "  • Generated client code: ${GREEN}VERIFIED${NC}"
echo ""
echo -e "${BLUE}The Docker image is ready for deployment!${NC}"
echo -e "Image name: ${IMAGE_NAME}"
echo -e "Build log: ${BUILD_LOG}"
echo ""
