import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listAllCommissionsQuery, countAllCommissionsQuery } from '@/lib/sanity/queries';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (id === 'list') {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const start = (page - 1) * limit;
      const end = start + limit;
      const [commissions, total] = await Promise.all([
        client.fetch(listAllCommissionsQuery, { status, start, end }),
        client.fetch(countAllCommissionsQuery, { status }),
      ]);
      return NextResponse.json({ success: true, data: commissions, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    }
    return NextResponse.json({ success: false, error: 'Use /api/commissions/list' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo comisiones' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.paymentDate) updateData.paymentDate = body.paymentDate;
    if (body.paymentReference) updateData.paymentReference = body.paymentReference;
    const updated = await writeClient.patch(id).set(updateData).commit();
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando comision' }, { status: 500 });
  }
}
