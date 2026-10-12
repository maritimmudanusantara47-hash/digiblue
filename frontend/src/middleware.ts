import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const role = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/assessor') ||
    (pathname.startsWith('/student') && !pathname.startsWith('/student/catalog'));

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Proteksi Berbasis Peran (Role-Based Access Control di Edge Middleware)
  if (token && role) {
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
    if (pathname.startsWith('/assessor') && !['admin', 'assessor'].includes(role)) {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/assessor/:path*', '/student/:path*'],
};
