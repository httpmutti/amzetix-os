import type { NextAuthConfig } from 'next-auth'
import type { UserRole } from '@prisma/client'

// 6 Hours Session Lifetime
const SIX_HOURS_IN_SECONDS = 6 * 60 * 60 // 21,600 seconds

export const authConfig: NextAuthConfig = {
  session: {
    strategy: 'jwt',
    maxAge: SIX_HOURS_IN_SECONDS, // Sessions expire and clear after 6 hours
    updateAge: 60 * 60, // Refreshes session window every 1 hour while user is active
  },
  jwt: {
    maxAge: SIX_HOURS_IN_SECONDS, // JWT cookie token expires after 6 hours
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.loginTime = Math.floor(Date.now() / 1000)
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
}
