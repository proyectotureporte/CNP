import { NextRequest, NextResponse } from 'next/server';
import { auditLog } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      auditLog.listAuditLogs(limit, offset),
      auditLog.countAuditLogs(),
    ]);

    return NextResponse.json({ success: true, data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo logs' }, { status: 500 });
  }
}
