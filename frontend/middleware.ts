import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add paths that require authentication here
const protectedPaths = [
  '/',
  '/dashboard/patients',
  '/dashboard/alerts',
  '/dashboard/analysis',
  '/dashboard/settings',
  '/dashboard/devices'
]

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtectedPath = protectedPaths.some(p => path === p || path.startsWith(p + '/'))
  
  const authCookie = request.cookies.get('fetalguard_auth')?.value

  if (isProtectedPath && !authCookie) {
    // Redirect to login if accessing a protected route without auth
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (path === '/login' && authCookie) {
    // Redirect to dashboard if trying to access login while already authenticated
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
