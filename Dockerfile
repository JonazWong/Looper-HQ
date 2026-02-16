# syntax=docker/dockerfile:1

# Looper HQ - Optimized Multi-stage Dockerfile for Monorepo
# Supports: @looper-hq/web (port 3005) and @looper-hq/legal-case-search (port 3001)

# =============================================================================
# Stage 1: Builder - Install dependencies and build
# =============================================================================
FROM node:20-alpine AS builder

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Install pnpm globally using corepack
RUN corepack enable && corepack prepare pnpm@9.15.2 --activate

# Copy ALL source files
COPY . .

# Set DATABASE_URL for Prisma generation
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"

# Install dependencies (including devDependencies needed for build)
# postinstall hook will generate Prisma Client
RUN pnpm install --frozen-lockfile

# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build workspace packages and apps using Turborepo
# Turborepo handles dependency graph and parallel builds automatically
RUN pnpm turbo build --filter=@looper-hq/web --filter=@looper-hq/legal-case-search

# =============================================================================
# Stage 2: Web App Runner - Production runtime for @looper-hq/web (port 3005)
# =============================================================================
FROM node:20-alpine AS runner-web

# Install minimal runtime dependencies
RUN apk add --no-cache curl openssl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone output (includes all runtime dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3005/api/health || exit 1

# Start the application
CMD ["node", "apps/web/server.js"]

# =============================================================================
# Stage 3: Legal Case Search App Runner - Production runtime for @looper-hq/legal-case-search (port 3001)
# =============================================================================
FROM node:20-alpine AS runner-legal

# Install minimal runtime dependencies
RUN apk add --no-cache curl openssl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone output (includes all runtime dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/apps/legal-case-search/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/legal-case-search/.next/static ./apps/legal-case-search/.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "apps/legal-case-search/server.js"]
