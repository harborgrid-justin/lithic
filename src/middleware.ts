import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/patients',
  '/appointments',
  '/clinical',
  '/billing',
  '/reports',
  '/settings',
];

// Routes that require admin role
const adminRoutes = [
  '/admin',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes (except protected ones)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('/api/auth/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if route requires authentication
  const requiresAuth = protectedRoutes.some((route) => pathname.startsWith(route));

  if (requiresAuth && !token) {
    // Redirect to login with callback URL
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  if (token) {
    // Check account status
    if (token.status === 'INACTIVE' || token.status === 'SUSPENDED' || token.status === 'LOCKED') {
      const url = new URL('/account-locked', request.url);
      return NextResponse.redirect(url);
    }

    // Check organization status
    if (token.organizationStatus !== 'ACTIVE') {
      const url = new URL('/organization-inactive', request.url);
      return NextResponse.redirect(url);
    }

    // Check if route requires admin role
    const requiresAdmin = adminRoutes.some((route) => pathname.startsWith(route));

    if (requiresAdmin) {
      const hasAdminAccess = token.role === 'ADMIN' || token.role === 'SUPER_ADMIN';

      if (!hasAdminAccess) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Security headers
    const response = NextResponse.next();

    // HIPAA-compliant security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // Content Security Policy
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https:; " +
      "frame-ancestors 'none';"
    );

    // Track session activity
    response.headers.set('X-User-Id', token.sub || '');
    response.headers.set('X-Organization-Id', (token.organizationId as string) || '');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
