# Architecture

Looper HQ uses a monorepo microservices architecture.

## Components
- Frontend: Next.js apps
- Backend: Spring Boot, Node.js, Flask
- Database: PostgreSQL + Prisma
- Auth: Keycloak

## Data Flow
User → App → API Gateway → Services → Database
