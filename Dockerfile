# Looper HQ - Multi-stage Dockerfile for Monorepo
# Optimized for Digital Ocean App Platform deployment

# =============================================================================
# Stage 1: Dependencies - Install all dependencies
# =============================================================================
FROM node:20-alpine AS deps

# Install system dependencies
RUN apk update && apk add --no-cache libc6-compat openssl

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.2

# Copy package files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy all workspace package.json files
COPY apps/web/package.json ./apps/web/
COPY apps/legal-case-search/package.json ./apps/legal-case-search/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
COPY packages/migration/package.json ./packages/migration/

# Copy Prisma schema files BEFORE installing dependencies
COPY packages/database/prisma ./packages/database/prisma

# Install dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# ⭐ Set DATABASE_URL for Prisma generation (required for schema validation)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"

# ⭐ Generate Prisma Client in deps stage with detailed logging
RUN echo "=== Generating Prisma Client in deps stage ===" && \
    cd packages/database && \
    npx prisma generate && \
    cd /app && \
    echo "Checking generated files:" && \
    (ls -la node_modules/.prisma/client || echo "Note: .prisma/client location may vary") && \
    echo "=== Deps stage Prisma generation complete ==="

# =============================================================================
# Stage 2: Builder - Build the application
# =============================================================================
FROM node:20-alpine AS builder

# Install system dependencies
RUN apk update && apk add --no-cache libc6-compat openssl

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.2

# Copy everything from deps stage (includes node_modules, package.json, prisma schema)
COPY --from=deps /app ./

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code (adds source files while keeping node_modules from deps)
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts

# ⭐ Set DATABASE_URL for Prisma generation (required even for schema validation)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"

# ⭐ Generate Prisma Client with verbose output
RUN echo "=== Starting Prisma Client Generation ===" && \
    echo "Working directory: $(pwd)" && \
    echo "Checking Prisma schema..." && \
    ls -la packages/database/prisma/schema.prisma && \
    echo "Generating Prisma client..." && \
    cd packages/database && \
    npx prisma generate && \
    cd /app && \
    echo "Checking generated client..." && \
    (ls -la node_modules/.prisma/client || echo "Warning: .prisma/client not in expected location") && \
    echo "=== Prisma Generation Complete ==="

# Build workspace packages that need compilation (TypeScript → JavaScript)
RUN pnpm --filter=@looper-hq/utils build

# Build the web application using Turborepo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build only the web app (main application)
RUN pnpm --filter=@looper-hq/web build

# =============================================================================
# Stage 3: Runner - Production runtime
# =============================================================================
FROM node:20-alpine AS runner

# Install curl for health checks
RUN apk update && apk add --no-cache curl openssl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install pnpm (needed for running migrations)
RUN npm install -g pnpm@9.15.2

# Copy necessary files from builder
# Note: Next.js standalone output includes all dependencies
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy Prisma schema and client for migrations
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/package.json ./packages/database/package.json

# ⭐ Critical fix: Copy Prisma client from builder (Next.js standalone doesn't include it)
# Use || true to continue even if copy fails (fallback will regenerate)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma || true
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma || true

# Copy compiled workspace packages
COPY --from=builder --chown=nextjs:nodejs /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/utils/package.json ./packages/utils/package.json

# Copy package.json files for reference
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# ⭐ Set DATABASE_URL placeholder (will be overridden by app.yaml at runtime)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"

# ⭐ Ensure Prisma client exists (regenerate if missing)
RUN echo "=== Checking Prisma Client in Runner Stage ===" && \
    if [ -d "./node_modules/.prisma/client" ]; then \
      echo "✅ Prisma client found (copied from builder)"; \
    else \
      echo "⚠️  Prisma client missing, generating now..."; \
      cd packages/database && \
      npx prisma generate && \
      cd /app; \
    fi && \
    echo "Final verification:" && \
    ls -la ./node_modules/.prisma/ && \
    echo "=== Prisma Client Ready ==="

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
# Note: Next.js standalone creates a server.js in the root
CMD ["node", "apps/web/server.js"]
