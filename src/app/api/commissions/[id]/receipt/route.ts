import { NextRequest, NextResponse } from 'next/server';
import { commission } from '@/lib/db';
import { actorFromRequest, requireCaseAccess } from '@/lib/auth/caseAccess';
import { canAccessFinances } from '@/lib/auth/permissions';
import { uploadFile } from '@/lib/sanity/assets';
import { notifyUsers } from '@/lib/notify';
import { triggerEvent } from '@/lib/realtime/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const actor = actorFromRequest(request);
    if (!actor || !canAccessFinances(actor.role, actor.allRoles)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }
    const row = await commission.getCommissionAccessRow(id);
    if (!row) return NextResponse.json({ success: false, error: 'Pago no encontrado' }, { status: 404 });
    if (row.caseId) {
      const access = await requireCaseAccess(request, row.caseId);
      if (access.response) return access.response;
    }
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Selecciona el comprobante' }, { status: 400 });
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'El comprobante supera 15 MB' }, { status: 400 });
    }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)
      && !/\.(pdf|jpe?g|png)$/i.test(file.name)) {
      return NextResponse.json({ success: false, error: 'El comprobante debe ser PDF, JPG o PNG' }, { status: 400 });
    }
    const asset = await uploadFile(
      Buffer.from(await file.arrayBuffer()),
      file.name,
      file.type || 'application/octet-stream',
    );
    const updated = await commission.updateCommission(id, {
      fileUrl: asset.url,
      fileAssetId: asset.assetId,
      fileName: asset.originalFilename || file.name,
      mimeType: asset.mimeType,
      fileSize: asset.size,
      status: 'pagada',
      paymentDate: new Date().toISOString(),
    });
    await notifyUsers({
      userIds: [row.expertId],
      title: 'Comprobante de tu pago disponible',
      message: 'Ya puedes consultar el comprobante de pago de tu servicio.',
      type: 'success',
      priority: 'alta',
      linkUrl: '/crm/commissions',
    });
    triggerEvent('commission:updated', { id });
    return NextResponse.json({
      success: true,
      data: updated && { ...updated, receiptDownloadUrl: `/api/commissions/${id}/receipt-download` },
    });
  } catch (error) {
    console.error('[commission-receipt] error:', error);
    return NextResponse.json({ success: false, error: 'Error cargando comprobante' }, { status: 500 });
  }
}
