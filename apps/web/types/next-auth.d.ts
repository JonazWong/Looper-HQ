/**
 * NextAuth.js v5 Type Declarations
 * 
 * Extends default NextAuth types to include custom properties
 * for Looper HQ application.
 */

import { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  /**
   * Extended Session interface with custom user properties
   */
  interface Session {
    user: {
      id: string
      role: UserRole
      keycloakId?: string
    } & DefaultSession["user"]
  }

  /**
   * Extended User interface for database user
   */
  interface User {
    id: string
    email: string
    name?: string | null
    role: UserRole
    keycloakId?: string | null
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT interface with custom claims
   */
  interface JWT {
    id: string
    role: UserRole
    keycloakId?: string
  }
}

declare module "next-auth/providers/keycloak" {
  interface KeycloakProfile {
    realm_access?: {
      roles: string[]
    }
    resource_access?: {
      [key: string]: {
        roles: string[]
      }
    }
  }
}
