import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT as DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: (DefaultSession['user'] & {
      id: string
      business?: {
        id: string
        name: string
        currency: string
        language: string
        theme: string
      }
    })
  }

  interface User extends DefaultUser {
    id: string
    business?: {
      id: string
      name: string
      currency: string
      language: string
      theme: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    business?: {
      id: string
      name: string
      currency: string
      language: string
      theme: string
    }
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      business?: {
        id: string
        name: string
        currency: string
        language: string
        theme: string
      }
    }
  }

  interface User {
    id: string
    email: string
    name: string
    business?: {
      id: string
      name: string
      currency: string
      language: string
      theme: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    business?: {
      id: string
      name: string
      currency: string
      language: string
      theme: string
    }
  }
}
