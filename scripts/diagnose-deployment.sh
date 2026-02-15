#!/bin/bash
# =============================================================================
# Looper HQ - Deployment Diagnostic Tool
# =============================================================================
# This script helps diagnose deployment issues by checking various aspects
# of the deployment configuration and providing actionable recommendations
#
# Usage: ./scripts/diagnose-deployment.sh [OPTIONS]
# Options:
#   --check-secrets    Check if GitHub secrets are accessible (requires GH CLI)
#   --check-do         Check Digital Ocean app status (requires doctl)
#   --check-build      Validate Dockerfile can build
#   --full             Run all diagnostics
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
CHECK_SECRETS=false
CHECK_DO=false
CHECK_BUILD=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --check-secrets)
            CHECK_SECRETS=true
            ;;
        --check-do)
            CHECK_DO=true
            ;;
        --check-build)
            CHECK_BUILD=true
            ;;
        --full)
            CHECK_SECRETS=true
            CHECK_DO=true
            CHECK_BUILD=true
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--check-secrets] [--check-do] [--check-build] [--full]"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Looper HQ - Deployment Diagnostics${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ISSUES_FOUND=0
WARNINGS=0

# =============================================================================
# 1. Basic File Structure Check
# =============================================================================
echo -e "${CYAN}📋 Checking deployment files...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FILES=(
    "Dockerfile"
    ".do/app.yaml"
    ".github/workflows/deploy-production.yml"
    "apps/web/app/api/health/route.ts"
    ".env.production.example"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file (MISSING)"
        ((ISSUES_FOUND++))
    fi
done

echo ""

# =============================================================================
# 2. Configuration Validation
# =============================================================================
echo -e "${CYAN}🔍 Validating configurations...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Dockerfile for critical sections
if grep -q "output: process.env.NODE_ENV === 'production' ? 'standalone'" apps/web/next.config.js; then
    echo -e "${GREEN}✅${NC} Next.js standalone output configured"
else
    echo -e "${RED}❌${NC} Next.js standalone output NOT configured"
    echo -e "   ${YELLOW}→ Add 'output: \"standalone\"' to next.config.js${NC}"
    ((ISSUES_FOUND++))
fi

if grep -q "outputFileTracingRoot" apps/web/next.config.js; then
    echo -e "${GREEN}✅${NC} outputFileTracingRoot configured for monorepo"
else
    echo -e "${YELLOW}⚠️${NC}  outputFileTracingRoot not configured"
    echo -e "   ${YELLOW}→ Add 'outputFileTracingRoot: path.join(__dirname, \"../../\")' to next.config.js${NC}"
    ((WARNINGS++))
fi

# Check .do/app.yaml for required configurations
if grep -q "source_dir: /" .do/app.yaml; then
    echo -e "${GREEN}✅${NC} Monorepo source_dir configured in app.yaml"
else
    echo -e "${RED}❌${NC} source_dir not set to root (/) in app.yaml"
    echo -e "   ${YELLOW}→ Add 'source_dir: /' to .do/app.yaml services section${NC}"
    ((ISSUES_FOUND++))
fi

if grep -q "dockerfile_path: Dockerfile" .do/app.yaml; then
    echo -e "${GREEN}✅${NC} Dockerfile path configured in app.yaml"
else
    echo -e "${RED}❌${NC} dockerfile_path not configured in app.yaml"
    echo -e "   ${YELLOW}→ Add 'dockerfile_path: Dockerfile' to .do/app.yaml${NC}"
    ((ISSUES_FOUND++))
fi

if grep -q "http_path: /api/health" .do/app.yaml; then
    echo -e "${GREEN}✅${NC} Health check path configured"
else
    echo -e "${YELLOW}⚠️${NC}  Health check path not configured in app.yaml"
    ((WARNINGS++))
fi

echo ""

# =============================================================================
# 3. Environment Variables Check
# =============================================================================
echo -e "${CYAN}🔐 Checking environment variable configuration...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REQUIRED_VARS=(
    "NEXTAUTH_SECRET"
    "DATABASE_URL"
    "OPENAI_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "$var" .do/app.yaml; then
        echo -e "${GREEN}✅${NC} $var configured in app.yaml"
    else
        echo -e "${RED}❌${NC} $var NOT found in app.yaml"
        ((ISSUES_FOUND++))
    fi
done

if grep -q "NEXTAUTH_URL" .do/app.yaml; then
    if grep -q 'value: ${APP_URL}' .do/app.yaml; then
        echo -e "${GREEN}✅${NC} NEXTAUTH_URL uses \${APP_URL} placeholder"
    else
        echo -e "${YELLOW}⚠️${NC}  NEXTAUTH_URL should use \${APP_URL}"
        ((WARNINGS++))
    fi
fi

echo ""

# =============================================================================
# 4. GitHub Secrets Check (Optional)
# =============================================================================
if [ "$CHECK_SECRETS" = true ]; then
    echo -e "${CYAN}🔑 Checking GitHub Secrets...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if command -v gh &> /dev/null; then
        echo "Checking secrets with GitHub CLI..."
        
        REQUIRED_SECRETS=(
            "DIGITALOCEAN_ACCESS_TOKEN"
            "DIGITALOCEAN_APP_ID"
        )
        
        for secret in "${REQUIRED_SECRETS[@]}"; do
            if gh secret list | grep -q "$secret"; then
                echo -e "${GREEN}✅${NC} $secret is set"
            else
                echo -e "${RED}❌${NC} $secret is NOT set"
                echo -e "   ${YELLOW}→ Set via: gh secret set $secret${NC}"
                ((ISSUES_FOUND++))
            fi
        done
    else
        echo -e "${YELLOW}⚠️${NC}  GitHub CLI (gh) not installed - skipping secret check"
        echo -e "   ${YELLOW}→ Install: https://cli.github.com/${NC}"
        echo -e "   ${YELLOW}→ Or check manually: https://github.com/JonazWong/Looper-HQ/settings/secrets/actions${NC}"
        ((WARNINGS++))
    fi
    
    echo ""
fi

# =============================================================================
# 5. Digital Ocean App Check (Optional)
# =============================================================================
if [ "$CHECK_DO" = true ]; then
    echo -e "${CYAN}☁️  Checking Digital Ocean App...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if command -v doctl &> /dev/null; then
        if doctl auth list &> /dev/null; then
            echo "Fetching app information..."
            
            # List apps
            APPS=$(doctl apps list --format ID,Spec.Name --no-header 2>/dev/null || echo "")
            
            if [ -z "$APPS" ]; then
                echo -e "${YELLOW}⚠️${NC}  No apps found or authentication issue"
                echo -e "   ${YELLOW}→ Run: doctl auth init${NC}"
                ((WARNINGS++))
            else
                echo -e "${GREEN}✅${NC} Apps found:"
                echo "$APPS"
                
                # Check for looper-hq app
                if echo "$APPS" | grep -q "looper-hq"; then
                    APP_ID=$(echo "$APPS" | grep "looper-hq" | awk '{print $1}')
                    echo ""
                    echo -e "${GREEN}✅${NC} looper-hq app found (ID: $APP_ID)"
                    
                    # Get latest deployment
                    echo ""
                    echo "Latest deployments:"
                    doctl apps list-deployments "$APP_ID" --format ID,Phase,Created --no-header | head -5
                else
                    echo -e "${YELLOW}⚠️${NC}  looper-hq app not found"
                    echo -e "   ${YELLOW}→ Create with: doctl apps create --spec .do/app.yaml${NC}"
                    ((WARNINGS++))
                fi
            fi
        else
            echo -e "${YELLOW}⚠️${NC}  Not authenticated with doctl"
            echo -e "   ${YELLOW}→ Run: doctl auth init${NC}"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠️${NC}  doctl not installed - skipping DO check"
        echo -e "   ${YELLOW}→ Install: https://docs.digitalocean.com/reference/doctl/how-to/install/${NC}"
        ((WARNINGS++))
    fi
    
    echo ""
fi

# =============================================================================
# 6. Docker Build Check (Optional)
# =============================================================================
if [ "$CHECK_BUILD" = true ]; then
    echo -e "${CYAN}🐳 Testing Dockerfile build...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if command -v docker &> /dev/null; then
        echo "Building Dockerfile (this may take a few minutes)..."
        
        if docker build -t looper-hq-test . &> /tmp/docker-build.log; then
            echo -e "${GREEN}✅${NC} Dockerfile builds successfully!"
            
            # Get image size
            IMAGE_SIZE=$(docker images looper-hq-test --format "{{.Size}}" 2>/dev/null || echo "unknown")
            echo -e "   Image size: $IMAGE_SIZE"
            
            # Cleanup
            docker rmi looper-hq-test &> /dev/null || true
        else
            echo -e "${RED}❌${NC} Dockerfile build FAILED"
            echo -e "   ${YELLOW}→ Check logs: tail -50 /tmp/docker-build.log${NC}"
            echo ""
            echo "Last 20 lines of build log:"
            tail -20 /tmp/docker-build.log
            ((ISSUES_FOUND++))
        fi
    else
        echo -e "${YELLOW}⚠️${NC}  Docker not installed - skipping build check"
        ((WARNINGS++))
    fi
    
    echo ""
fi

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Diagnostic Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✨ All diagnostics passed!${NC}"
    echo ""
    echo "Your deployment configuration looks good. Next steps:"
    echo "1. Review QUICK_DEPLOY.md for deployment instructions"
    echo "2. Ensure GitHub Secrets are set: DIGITALOCEAN_ACCESS_TOKEN, DIGITALOCEAN_APP_ID"
    echo "3. Ensure DO Console has: NEXTAUTH_SECRET, OPENAI_API_KEY"
    echo "4. Push to main branch to trigger deployment"
elif [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Diagnostics completed with ${WARNINGS} warning(s)${NC}"
    echo ""
    echo "Warnings are usually optional issues. Review them and decide if action is needed."
    echo "You can proceed with deployment if you're comfortable with the warnings."
else
    echo -e "${RED}❌ Found ${ISSUES_FOUND} issue(s) and ${WARNINGS} warning(s)${NC}"
    echo ""
    echo "Critical issues must be fixed before deployment. Review the output above."
    echo ""
    echo "Common fixes:"
    echo "• Missing files: Ensure all deployment files are committed"
    echo "• Configuration errors: Review .do/app.yaml and next.config.js"
    echo "• Missing secrets: Set them in GitHub and DO Console"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Useful commands
echo -e "${CYAN}🔧 Useful Commands:${NC}"
echo ""
echo "# Validate deployment files"
echo "./scripts/validate-deployment.sh"
echo ""
echo "# Check GitHub Actions status"
echo "gh run list --limit 5"
echo ""
echo "# View DO app logs"
echo "doctl apps logs <APP_ID> --type RUN --follow"
echo ""
echo "# Trigger deployment manually"
echo "git push origin main"
echo ""
echo "# Check health endpoint (replace URL)"
echo "curl https://your-app.ondigitalocean.app/api/health"
echo ""

exit $([ $ISSUES_FOUND -eq 0 ] && echo 0 || echo 1)
