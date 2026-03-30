import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"
import Keycloak from "next-auth/providers/keycloak"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import { UserRole } from "@looper-hq/database"

// Extend NextAuth types for custom session properties
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      keycloakId?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
    keycloakId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    keycloakId?: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Trust host in production (required for custom domains)
  trustHost: true,
  
  // Secret for JWT encryption
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  
  providers: [
    // Keycloak OAuth provider (disabled until configured)
    ...(process.env.KEYCLOAK_CLIENT_ID && process.env.KEYCLOAK_CLIENT_SECRET && process.env.KEYCLOAK_ISSUER
      ? [
          Keycloak({
            clientId: process.env.KEYCLOAK_CLIENT_ID,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
            issuer: process.env.KEYCLOAK_ISSUER,
            authorization: {
              params: {
                scope: "openid email profile",
              },
            },
          }),
        ]
      : []),
    
    // Credentials provider as fallback (for local development/testing)
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          return null
        }

        // For development: Accept any password for existing users
        // In production, this should validate against Keycloak or use bcrypt
        // Since the database doesn't store passwords (using Keycloak), 
        // we just verify the user exists
        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          role: user.role,
          keycloakId: user.keycloakId || undefined,
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/zh/login",  // 使用默認 locale 前綴
    error: "/zh/login",
  },

  callbacks: {
    /**
     * JWT callback - runs when JWT is created or updated
     * Maps Keycloak user data to our application user model
     */
    async jwt({ token, user, account, profile }) {
      // Initial sign in - sync Keycloak user to database
      if (account && profile) {
        // Extract Keycloak user info
        const keycloakId = profile.sub as string
        const email = profile.email as string
        const name = profile.name as string

        // Extract role from Keycloak (from realm_access or resource_access)
        let keycloakRole: UserRole = "CLIENT" // default role
        
        const keycloakProfile = profile as any
        if (keycloakProfile.realm_access?.roles) {
          const roles = keycloakProfile.realm_access.roles as string[]
          
          // Map Keycloak roles to app roles (case-insensitive)
          if (roles.some(r => r.toUpperCase() === "ADMIN")) {
            keycloakRole = "ADMIN"
          } else if (roles.some(r => r.toUpperCase() === "LAWYER")) {
            keycloakRole = "LAWYER"
          } else if (roles.some(r => r.toUpperCase() === "STAFF")) {
            keycloakRole = "STAFF"
          } else if (roles.some(r => r.toUpperCase() === "CLIENT")) {
            keycloakRole = "CLIENT"
          }
        }

        // Upsert user in database (sync Keycloak user)
        const dbUser = await prisma.user.upsert({
          where: { keycloakId },
          update: {
            email,
            name,
            role: keycloakRole,
          },
          create: {
            email,
            name,
            keycloakId,
            role: keycloakRole,
          },
        })

        token.id = dbUser.id
        token.role = dbUser.role
        token.keycloakId = dbUser.keycloakId || undefined
      }

      // Subsequent requests - add user data from initial token or user object
      if (user) {
        token.id = user.id
        token.role = user.role
        token.keycloakId = user.keycloakId
      }

      return token
    },

    /**
     * Session callback - runs when session is checked
     * Adds custom fields from JWT to session object
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.keycloakId = token.keycloakId
      }

      return session
    },
    
    // NOTE: authorized() callback removed - all auth logic handled in middleware.ts
    // This prevents conflicts between NextAuth's routing and our custom i18n middleware
  },

  events: {
    /**
     * Log sign in events for audit trail
     */
    async signIn({ user, account }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`)
      
      // Create activity log
      if (user.id) {
        await prisma.activity.create({
          data: {
            userId: user.id,
            activityType: "STATUS_CHANGED",
            action: "USER_SIGNED_IN",
            description: `User signed in via ${account?.provider}`,
            metaData: {
              provider: account?.provider,
              timestamp: new Date().toISOString(),
            },
          },
        }).catch(err => {
          console.error("Failed to create sign-in activity log:", err)
        })
      }
    },
  },

  debug: process.env.NODE_ENV === "development",
})
