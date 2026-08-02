import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = publicPaths.includes(path);
  
  const authCookie = request.cookies.get('fetalguard_auth')?.value;

  // Unauthenticated users must authenticate first at /login
  if (!isPublicPath && !authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Already authenticated users visiting login/register are redirected to live dashboard
  if (isPublicPath && authCookie && path !== '/forgot-password') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
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
