# GitHub Copilot Instructions for Looper HQ

## 🎯 Project Overview

Looper HQ is a unified legal case management and inquiry platform for Hong Kong, built with a monorepo microservices architecture.

**Tech Stack:**
- Frontend: Next.js 15, React 19, TailwindCSS
- Backend: Spring Boot 3, Node.js, Flask
- Database: PostgreSQL, Prisma, Redis
- Auth: Keycloak, NextAuth.js
- Tools: Docker, Turborepo, pnpm

## 📋 Mandatory Pre-Change Analysis

Before any modification, addition, deletion, or change to the project, mandatory analysis is required:

### Impact Assessment

1. **Analyze** impact on overall project operations
2. **Identify** all related functions, modules, and dependencies
3. **Predict** chain reactions and required adjustments
4. **List** all follow-up tasks explicitly

### Function Protection Principles

- **No unauthorized reduction**: Any removal or simplification requires explicit approval
- **Integrity maintenance**: Ensure changes don't break existing functionality
- **Backward compatibility**: Maintain compatibility with existing systems

### Optimization Standards

- **Performance**: Evaluate impact on system efficiency
- **Maintainability**: Ensure code quality and readability improvement
- **Scalability**: Consider future development needs

## 🚫 Prohibited Actions

- ❌ Simplifying features to reduce workload
- ❌ Making changes without analysis
- ❌ Ignoring chain reactions
- ❌ Sacrificing quality for speed
- ❌ Unauthorized deletion or simplification of existing features

## 🛠️ Development Guidelines

### Monorepo Structure

```
looper-hq/
├── apps/          # Applications (web, admin)
├── services/      # Microservices
├── packages/      # Shared packages
├── infrastructure/
└── docs/
```

### Code Quality

- Use TypeScript for type safety
- Follow existing code patterns and conventions
- Write meaningful commit messages
- Add tests for new features
- Run linters before committing: `pnpm lint`

### Testing

- Run specific tests: `turbo run test --filter=<package>`
- Ensure all tests pass before submitting changes
- Add unit tests for business logic
- Add integration tests for API endpoints

### Build & Development

- Start development: `pnpm dev`
- Build all packages: `pnpm build`
- Use Turbo cache for faster builds
- Test locally with Docker: `pnpm docker:up`

### Database Changes

- Use Prisma migrations: `pnpm db:migrate`
- Push schema changes: `pnpm db:push`
- Seed database: `pnpm db:seed`
- Never modify migrations after they're committed

## 💡 Work Attitude

**Proactive** • **Rigorous** • **Excellence-driven** • **Results-oriented**
