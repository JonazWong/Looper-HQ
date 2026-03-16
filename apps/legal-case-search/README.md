# Looper HQ — Legal Case Search Portal

Public-facing legal case search portal, available on port **3001**.

## Setup

This app queries the main `@looper-hq/web` application's public API to search cases.

### Environment Variables

Create a `.env.local` file in this directory:

```env
# URL of the main Looper HQ web app (required for production)
NEXT_PUBLIC_WEB_APP_URL=http://localhost:3005
```

In production, set `NEXT_PUBLIC_WEB_APP_URL` to the actual deployed URL of the main app.

## Development

```bash
# From repo root
pnpm dev:legal        # Start on port 3001

# Or from this directory
pnpm dev              # Start on port 3001
```

## Build

```bash
pnpm build
pnpm start
```
