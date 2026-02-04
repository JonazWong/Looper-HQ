import NextAuth from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || 'legal-case-search',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
      issuer: process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/looper-hq',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Add role information from database
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, firmId: true, firmOwner: true },
        })
        if (dbUser) {
          session.user.role = dbUser.role
          session.user.firmId = dbUser.firmId
          session.user.firmOwner = dbUser.firmOwner
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database' as const,
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
