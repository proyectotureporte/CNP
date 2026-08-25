import { NextRequest, NextResponse } from 'next/server';
import { deliverable } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const stop = guardRole(request, (role) => hasPermission(role, 'deliverables'));
    if (stop) return stop;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const phase = searchParams.get('phase') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id') || '';

    if (role === 'cliente') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    const [rawData, total] = role === 'perito' || role === 'perito_interno'
      ? await Promise.all([
          deliverable.listExpertDeliverables(userId, status, phase, limit, offset),
          deliverable.countExpertDeliverables(userId, status, phase),
        ])
      : await Promise.all([
          deliverable.listAllDeliverables(status, phase, limit, offset),
          deliverable.countAllDeliverables(status, phase),
        ]);
    const data = rawData.map((item) => ({
      ...item,
      fileUrl: undefined,
      downloadUrl: `/api/deliverables/${item._id}/download`,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo entregas' }, { status: 500 });
  }
}
