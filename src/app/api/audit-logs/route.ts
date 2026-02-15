import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { listAuditLogsQuery, countAuditLogsQuery } from '@/lib/sanity/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const start = (page - 1) * limit;
    const end = start + limit;

    const [logs, total] = await Promise.all([
      client.fetch(listAuditLogsQuery, { start, end }),
      client.fetch(countAuditLogsQuery),
    ]);

    return NextResponse.json({ success: true, data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo logs' }, { status: 500 });
  }
}
