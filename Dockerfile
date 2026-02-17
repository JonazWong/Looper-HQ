# syntax=docker/dockerfile:1

# Looper HQ - Optimized Multi-stage Dockerfile for Production
# Supports: @looper-hq/web (port 3000)

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
RUN pnpm turbo build --filter=@looper-hq/web

# Re-generate Prisma Client with correct binary targets for production (pinned Prisma 5)
RUN cd packages/database && npx prisma@5.17.0 generate

# =============================================================================
# Stage 2: Web App Runner - Production runtime for @looper-hq/web (port 3000)
# =============================================================================
FROM node:20-alpine AS runner-web

# Install minimal runtime dependencies
RUN apk add --no-cache curl openssl

WORKDIR /app

# Install pnpm for Prisma CLI installation
RUN corepack enable && corepack prepare pnpm@9.15.2 --activate

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone output (includes all runtime dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy Prisma schema for runtime operations
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json

# Install Prisma CLI, tsx, and runtime dependencies
RUN cd packages/database && \
    pnpm add -D prisma@5.17.0 tsx@4.7.0 && \
    pnpm add @prisma/client@5.17.0 && \
    npx prisma@5.17.0 generate

# Copy startup script from build context
COPY scripts/startup.sh ./scripts/startup.sh
RUN chmod +x ./scripts/startup.sh

# Change ownership after all files are copied
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application with migration support
CMD ["sh", "./scripts/startup.sh"]
