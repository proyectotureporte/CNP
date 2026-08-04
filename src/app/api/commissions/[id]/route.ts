import { NextRequest, NextResponse } from 'next/server';
import { commission } from '@/lib/db';
import type { CommissionStatus, UserRole } from '@/lib/types';
import { guardRole } from '@/lib/auth/guard';
import { canAccessFinances } from '@/lib/auth/permissions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (id === 'list') {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;
      const role = request.headers.get('x-user-role');
      const userId = request.headers.get('x-user-id') || '';
      if (role === 'cliente') {
        return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
      }
      if (role !== 'perito' && (!role || !canAccessFinances(role as UserRole))) {
        return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
      }
      const [commissions, total] = role === 'perito'
        ? await Promise.all([
            commission.listExpertCommissions(userId, status, limit, offset),
            commission.countExpertCommissions(userId, status),
          ])
        : await Promise.all([
            commission.listAllCommissions(status, limit, offset),
            commission.countAllCommissions(status),
          ]);
      const data = commissions.map((item) => ({
        ...item,
        receiptDownloadUrl: item.receiptFileName ? `/api/commissions/${item._id}/receipt-download` : undefined,
      }));
      return NextResponse.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    }
    const found = await commission.getCommissionById(id);
    if (!found) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    if (role === 'perito' && found.expert?._id !== userId) {
      return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    }
    if (role !== 'perito' && (!role || !canAccessFinances(role as UserRole))) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    return NextResponse.json({
      success: true,
      data: { ...found, receiptDownloadUrl: found.receiptFileName ? `/api/commissions/${id}/receipt-download` : undefined },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo comisiones' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const stop = guardRole(request, canAccessFinances);
    if (stop) return stop;

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
