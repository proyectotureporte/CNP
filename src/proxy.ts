import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { canAccessRoute } from '@/lib/auth/permissions';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login pages, public routes, and API auth routes
  if (
    pathname === '/crm/login' ||
    pathname === '/admin/login' ||
    pathname === '/portal/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/admin/init'
  ) {
    return NextResponse.next();
  }

  // Protect /portal routes - cliente role only
  if (pathname.startsWith('/portal')) {
    const token = request.cookies.get('crm-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'cliente') {
      const response = NextResponse.redirect(new URL('/portal/login', request.url));
      response.cookies.delete('crm-token');
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-name', payload.displayName);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Protect /crm routes - unified token
  if (pathname.startsWith('/crm')) {
    const token = request.cookies.get('crm-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/crm/login', request.url));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/crm/login', request.url));
      response.cookies.delete('crm-token');
      return response;
    }

    // Check role-based route access
    if (!canAccessRoute(payload.role, pathname)) {
      return NextResponse.redirect(new URL('/crm', request.url));
    }

    // Inject user info into headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-name', payload.displayName);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Protect /admin routes - admin role only
  if (pathname.startsWith('/admin')) {
    const token =
      request.cookies.get('admin-token')?.value ||
      request.cookies.get('crm-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin-token');
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-name', payload.displayName);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Protect API routes
  if (pathname.startsWith('/api/')) {
    // Skip auth endpoints (already handled above)
    if (pathname.startsWith('/api/auth/') || pathname === '/api/admin/init') {
      return NextResponse.next();
    }

    const authHeader = request.headers.get('authorization');
    const cookieToken =
      request.cookies.get('admin-token')?.value ||
      request.cookies.get('crm-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token invalido' }, { status: 401 });
    }

    // Admin API routes require admin role
    if (pathname.startsWith('/api/admin') && payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-name', payload.displayName);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/crm/:path*',
    '/admin/:path*',
    '/portal/:path*',
    '/api/:path*',
  ],
};
