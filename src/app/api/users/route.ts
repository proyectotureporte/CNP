import { NextResponse } from 'next/server';
import { crmUser } from '@/lib/db';

export async function GET() {
  try {
    const users = await crmUser.listActiveUsersBasic();
    return NextResponse.json({ success: true, data: users });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo usuarios' }, { status: 500 });
  }
}
