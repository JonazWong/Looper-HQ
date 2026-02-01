# Quick Start

## Prerequisites
- Node.js 18+
- pnpm 8+
- Docker

## Steps
1. Clone repo
2. Install deps: `pnpm install`
3. Setup env: `cp .env.example .env`
4. Start Docker: `pnpm docker:up`
5. Init DB: `pnpm db:push && pnpm db:seed`
6. Run: `pnpm dev`
