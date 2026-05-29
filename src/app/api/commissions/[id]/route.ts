import { NextRequest, NextResponse } from 'next/server';
import { commission } from '@/lib/db';
import type { CommissionStatus } from '@/lib/types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (id === 'list') {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;
      const [commissions, total] = await Promise.all([
        commission.listAllCommissions(status, limit, offset),
        commission.countAllCommissions(status),
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
    const updated = await commission.updateCommission(id, {
      status: body.status as CommissionStatus | undefined,
      paymentDate: body.paymentDate,
      paymentReference: body.paymentReference,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Error actualizando comision' }, { status: 500 });
  }
}
