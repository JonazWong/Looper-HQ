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

# ⭐ Critical fix: Set placeholder DATABASE_URL for Prisma generation
# Prisma generate requires this env var to exist (even if not connecting to DB)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# ⭐ Critical fix: Explicitly generate Prisma client in deps stage
# This ensures .prisma directory exists and can be copied to runner stage
RUN pnpm --filter=@looper-hq/database prisma generate

# Verify Prisma client was generated successfully
RUN ls -la /app/node_modules/.prisma/client && echo "✅ Prisma client generated successfully"

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

# ⭐ Set placeholder DATABASE_URL for Prisma generation in builder stage
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Generate Prisma Client (required before build)
RUN pnpm --filter=@looper-hq/database prisma generate

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

# Copy Prisma schema and generated client for migrations
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/prisma ./packages/database/prisma

# ⭐ Critical fix: Copy Prisma client from builder stage (has latest generated client)
# Next.js standalone doesn't include .prisma by default, so we copy it explicitly
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled workspace packages
COPY --from=builder --chown=nextjs:nodejs /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/utils/package.json ./packages/utils/package.json

# Copy package.json files for reference
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# ⭐ Verify Prisma client was copied successfully
RUN if [ -d "./node_modules/.prisma/client" ]; then \
      echo "✅ Prisma client found in ./node_modules/.prisma/client"; \
      ls -la ./node_modules/.prisma/client | head -5; \
    else \
      echo "❌ Prisma client missing"; \
      echo "Contents of ./node_modules/:"; \
      ls -la ./node_modules/ | head -10 || echo "node_modules not found"; \
      exit 1; \
    fi

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
