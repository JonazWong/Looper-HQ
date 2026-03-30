# NextAuth.js v5 + Keycloak Authentication Setup

This directory contains the authentication implementation for Looper HQ using NextAuth.js v5 with Keycloak integration.

## 📁 File Structure

```
apps/web/
├── auth.ts                          # NextAuth v5 configuration
├── middleware.ts                    # Route protection middleware
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts         # NextAuth API routes
├── lib/
│   └── api/
│       └── auth.ts                  # Server-side auth helpers
├── types/
│   └── next-auth.d.ts              # TypeScript type extensions
└── .env.local.example              # Environment variables template
```

## 🔐 Features

- ✅ **Keycloak SSO Integration** - Primary authentication via Keycloak OAuth
- ✅ **Credentials Fallback** - Email/password login for local development
- ✅ **Role-Based Access Control** - ADMIN, LAWYER, CLIENT, STAFF roles
- ✅ **Database Sync** - Automatic user sync from Keycloak to PostgreSQL
- ✅ **Session Management** - JWT-based sessions with 30-day expiry
- ✅ **Route Protection** - Middleware-based authentication for pages and APIs
- ✅ **Type Safety** - Full TypeScript support with extended types
- ✅ **Activity Logging** - Automatic sign-in/sign-out event logging

## 🚀 Setup Instructions

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

\`\`\`bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Keycloak Configuration
KEYCLOAK_CLIENT_ID=looper-hq-web
KEYCLOAK_CLIENT_SECRET=looper-hq-local-dev-secret
KEYCLOAK_ISSUER=http://localhost:8080/realms/looper-hq
NEXT_PUBLIC_KEYCLOAK_ENABLED=true
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=looper-hq
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=looper-hq-web

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/looper_hq
\`\`\`

**Generate NEXTAUTH_SECRET:**
\`\`\`bash
openssl rand -base64 32
\`\`\`

### 2. Keycloak Configuration

1. **Create Realm**: `looper-hq`
2. **Create Client**: 
  - Client ID: `looper-hq-web`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
  - Valid Redirect URIs: `http://localhost:3005/api/auth/callback/keycloak`, `https://www.looperhq.hk/api/auth/callback/keycloak`
3. **Configure Roles**:
   - Create realm roles: `ADMIN`, `LAWYER`, `CLIENT`, `STAFF`
   - Assign roles to users
4. **Get Client Secret**:
   - Go to Credentials tab
   - Copy the secret to `KEYCLOAK_CLIENT_SECRET`

### 2.1 Production Alignment

For DigitalOcean, use the same realm and client naming as local development, then set the production values in App Platform:

- `KEYCLOAK_CLIENT_ID=looper-hq-web`
- `KEYCLOAK_CLIENT_SECRET=<production-secret>`
- `KEYCLOAK_ISSUER=https://your-keycloak-domain.com/realms/looper-hq`
- `NEXT_PUBLIC_KEYCLOAK_ENABLED=true`
- `NEXT_PUBLIC_KEYCLOAK_URL=https://your-keycloak-domain.com`
- `NEXT_PUBLIC_KEYCLOAK_REALM=looper-hq`
- `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=looper-hq-web`

### 3. Database Migration

Ensure the Prisma schema includes the `keycloakId` field:

\`\`\`bash
npx prisma migrate dev
\`\`\`

The User model should have:
\`\`\`prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String?
  role       UserRole @default(CLIENT)
  keycloakId String?  @unique  // ← Required for Keycloak sync
  // ... other fields
}
\`\`\`

### 4. Install Dependencies

\`\`\`bash
npm install @auth/prisma-adapter --legacy-peer-deps
\`\`\`

## 📖 Usage

### Server-Side Authentication

#### In Server Components:
\`\`\`typescript
import { auth } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }
  
  return <div>Welcome, {session.user.name}</div>
}
\`\`\`

#### In API Routes:
\`\`\`typescript
import { requireAuth, requireRole } from "@/lib/api/auth"

export async function GET() {
  // Require authentication
  const session = await requireAuth()
  
  // Or require specific role
  const adminSession = await requireRole("ADMIN", "LAWYER")
  
  return Response.json({ user: session.user })
}
\`\`\`

#### Permission Checks:
\`\`\`typescript
import { requireAuth, hasPermission, canAccessResource } from "@/lib/api/auth"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await requireAuth()
  
  // Check permission
  if (!hasPermission(session, "case:delete")) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  
  // Check resource ownership
  const case = await prisma.case.findUnique({ where: { id: params.id } })
  if (!canAccessResource(session, case.clientId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  
  // Delete case...
}
\`\`\`

### Client-Side Authentication

#### Using useSession hook:
\`\`\`typescript
"use client"

import { useSession } from "next-auth/react"

export function UserProfile() {
  const { data: session, status } = useSession()
  
  if (status === "loading") {
    return <div>Loading...</div>
  }
  
  if (!session) {
    return <div>Not authenticated</div>
  }
  
  return (
    <div>
      <p>Name: {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
    </div>
  )
}
\`\`\`

#### Sign In/Out:
\`\`\`typescript
"use client"

import { signIn, signOut } from "next-auth/react"

export function AuthButtons() {
  return (
    <>
      <button onClick={() => signIn("keycloak")}>
        Sign in with Keycloak
      </button>
      <button onClick={() => signIn("credentials", { email, password })}>
        Sign in with Email
      </button>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </>
  )
}
\`\`\`

## 🛡️ Route Protection

### Middleware Protection

The middleware automatically protects routes:

- **Protected Routes**: `/dashboard/*`, `/api/*` (except `/api/auth/*`)
- **Public Routes**: `/`, `/login`, `/register`, `/api/health`

Unauthenticated users are redirected to `/login` with a `callbackUrl` parameter.

### Manual Protection

For additional protection in specific pages:

\`\`\`typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await auth()
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }
  
  return <div>Admin Panel</div>
}
\`\`\`

## 🔄 User Synchronization Flow

1. **User logs in via Keycloak**
2. **JWT callback extracts user data**:
   - `keycloakId` from `profile.sub`
   - `email`, `name` from profile
   - `role` from `realm_access.roles`
3. **Database upsert**:
   - If user exists (by `keycloakId`): update email, name, role
   - If new user: create with Keycloak data
4. **Session populated** with database user ID and role
5. **Activity log created** for sign-in event

## 🎭 Role Mapping

Keycloak roles are mapped to application roles:

| Keycloak Role | App Role | Permissions |
|---------------|----------|-------------|
| ADMIN         | ADMIN    | All permissions |
| LAWYER        | LAWYER   | Manage cases, clients, documents |
| STAFF         | STAFF    | Read-only access to cases |
| CLIENT        | CLIENT   | View own cases and documents |

Roles are case-insensitive during mapping.

## 🐛 Troubleshooting

### "Invalid environment variables"
- Ensure all required env vars are set in `.env.local`
- Restart the dev server after changing env vars

### "Keycloak connection failed"
- Check `KEYCLOAK_ISSUER` URL is correct
- Verify Keycloak is running
- Check client credentials

### "Session not found"
- Clear browser cookies
- Check `NEXTAUTH_SECRET` is set
- Verify database connection

### "Role not syncing"
- Check Keycloak realm roles are correctly configured
- Verify role names match (ADMIN, LAWYER, CLIENT, STAFF)
- Check `realm_access.roles` in Keycloak token

## 📚 References

- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)

## 🔒 Security Notes

- Always use HTTPS in production
- Rotate `NEXTAUTH_SECRET` regularly
- Keep Keycloak client secret secure
- Implement rate limiting for auth endpoints
- Enable CSRF protection (enabled by default)
- Use secure cookies in production (automatic when using HTTPS)
