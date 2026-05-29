import { NextResponse } from 'next/server';
import { webLead } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('crm-token')?.value;
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const payload = await verifyToken(token).catch(() => null);
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const data = await webLead.listWebLeads();

  return NextResponse.json({ success: true, data });
}
