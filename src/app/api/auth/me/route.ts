import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') || 'crm';
  const adminToken = request.cookies.get('admin-token')?.value;
  const crmToken = request.cookies.get('crm-token')?.value;

  // Pick token based on requested type
  const token = type === 'admin' ? (adminToken || crmToken) : (crmToken || adminToken);
  if (!token) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      sub: payload.sub,
      role: payload.role,
      displayName: payload.displayName,
    },
  });
}
