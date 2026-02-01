# 🔄 Looper HQ

> **Unified Legal Case Management & Inquiry Platform for Hong Kong**

## 🌟 Features

- Case Management
- Client Portal
- Time Tracking & Billing
- Document Management
- Public Case Search
- Multi-tenancy Support
- OAuth/OIDC Authentication

## 🚀 Quick Start

```bash
git clone https://github.com/JonazWong/Looper-HQ.git
cd Looper-HQ
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:push
pnpm db:seed
pnpm dev
```

## 📦 Structure

```
looper-hq/
├── apps/          # Applications
│   └── web/       # Next.js web application
├── services/      # Microservices
├── packages/      # Shared packages
├── infrastructure/
└── docs/
```

## 🛠️ Tech Stack

- Next.js 14, React 19, TailwindCSS
- Spring Boot 3, Node.js, Flask
- PostgreSQL, Prisma, Redis
- Keycloak, NextAuth.js
- Docker, Turborepo, pnpm

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Quick Start](docs/QUICKSTART.md)
- [Migration Guide](docs/migration/README.md)

## 📄 License

MIT License