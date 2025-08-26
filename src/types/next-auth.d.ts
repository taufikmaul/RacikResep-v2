import NextAuth from 'next-auth'

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
