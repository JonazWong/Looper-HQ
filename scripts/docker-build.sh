#!/usr/bin/env bash
# =============================================================================
# Looper HQ - Docker Build Script
# =============================================================================
# Builds all Docker images for the Looper HQ platform
#
# Usage:
#   ./scripts/docker-build.sh [--no-cache] [--push]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
BUILD_ARGS=()
PUSH_IMAGES=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-cache)
      BUILD_ARGS+=(--no-cache)
      shift
      ;;
    --push)
      PUSH_IMAGES=true
      shift
      ;;
    --tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    --registry)
      DOCKER_REGISTRY="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get image name with optional registry prefix
get_image_name() {
  local name=$1
  if [[ -n "$DOCKER_REGISTRY" ]]; then
    echo "${DOCKER_REGISTRY}/${name}:${IMAGE_TAG}"
  else
    echo "looper-hq/${name}:${IMAGE_TAG}"
  fi
}

# Build an image
build_image() {
  local target=$1
  local name=$2
  local image_name=$(get_image_name "$name")
  
  log_info "Building $name image (target: $target)..."
  
  if docker build \
    --target "$target" \
    --tag "$image_name" \
    "${BUILD_ARGS[@]}" \
    -f Dockerfile \
    .; then
    log_success "Built $image_name"
    
    # Push if requested
    if [[ "$PUSH_IMAGES" == true ]]; then
      log_info "Pushing $image_name..."
      if docker push "$image_name"; then
        log_success "Pushed $image_name"
      else
        log_error "Failed to push $image_name"
        return 1
      fi
    fi
    
    return 0
  else
    log_error "Failed to build $image_name"
    return 1
  fi
}

# Main execution
main() {
  log_info "Starting Docker build process..."
  log_info "Image tag: $IMAGE_TAG"
  
  if [[ -n "$DOCKER_REGISTRY" ]]; then
    log_info "Registry: $DOCKER_REGISTRY"
  fi
  
  # Check if Docker is running
  if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
  fi
  
  # Build images
  local failed=0
  
  # Build web application
  if ! build_image "web-runner" "web"; then
    ((failed++))
  fi
  
  # Build legal case search application
  if ! build_image "legal-runner" "legal-case-search"; then
    ((failed++))
  fi
  
  # Summary
  echo ""
  echo "=============================================="
  if [[ $failed -eq 0 ]]; then
    log_success "All images built successfully!"
  else
    log_error "$failed image(s) failed to build"
    exit 1
  fi
  
  # Show built images
  echo ""
  log_info "Built images:"
  docker images "looper-hq/*:${IMAGE_TAG}" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}"
}

main "$@"
