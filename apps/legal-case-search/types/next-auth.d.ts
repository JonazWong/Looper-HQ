import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role?: 'ADMIN' | 'LAWYER' | 'CLIENT' | 'STAFF'
      firmId?: string | null
      firmOwner?: boolean
    } & DefaultSession['user']
  }

  interface User {
    role?: 'ADMIN' | 'LAWYER' | 'CLIENT' | 'STAFF'
    firmId?: string | null
    firmOwner?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: 'ADMIN' | 'LAWYER' | 'CLIENT' | 'STAFF'
    firmId?: string | null
    firmOwner?: boolean
  }
}
