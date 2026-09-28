import { NextRequest, NextResponse } from 'next/server';
import { payment } from '@/lib/db';
import { quote } from '@/lib/db';
import { requireCaseAccess } from '@/lib/auth/caseAccess';
import type { Quote } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quoteRow = await quote.getQuoteById(id) as (Quote & { case?: { _id: string } }) | null;
    const caseId = quoteRow?.case?._id;
    if (!caseId) return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    const access = await requireCaseAccess(request, caseId);
    if (access.response) return access.response;
    if (!access.actor.allRoles && !['comercial_juridico', 'junta', 'cliente'].includes(access.actor.role)) {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    }
    if (access.actor.role === 'cliente' && quoteRow?.status !== 'aprobada') {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    }
    const payments = await payment.listQuotePayments(id);
    return NextResponse.json({ success: true, data: payments.map((item) => ({ ...item, receiptUrl: undefined, receiptDownloadUrl: item.receiptUrl ? `/api/payments/${item._id}/receipt-download` : undefined })) });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo pagos de cotizacion' },
      { status: 500 }
    );
  }
}
