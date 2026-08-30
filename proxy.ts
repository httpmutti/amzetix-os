import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register']
const CLIENT_PORTAL_ROUTES = ['/portal']
const INTERNAL_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'HR', 'ACCOUNTANT', 'EMPLOYEE']

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const pathname = nextUrl.pathname

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // API routes — 401 only, no redirects
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (!session) {
    if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return NextResponse.next()
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user?.role as string

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    const dest = role === 'CLIENT' ? '/portal' : '/dashboard'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  if (role === 'CLIENT') {
    if (!CLIENT_PORTAL_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/portal', req.url))
    }
    return NextResponse.next()
  }

  if (INTERNAL_ROLES.includes(role)) {
    if (CLIENT_PORTAL_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}