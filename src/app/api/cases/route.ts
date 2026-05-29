import { NextRequest, NextResponse } from 'next/server';
import { cases, crmClient, caseDocument, query } from '@/lib/db';
import { getClientIdForUser } from '@/lib/auth/clientAccess';
import { CASE_DISCIPLINES, CASE_COMPLEXITIES, CASE_PRIORITIES } from '@/lib/types';
import { triggerEvent } from '@/lib/pusher/server';

function generateCaseCode(latestCode: string | null, brand: string): string {
  const year = new Date().getFullYear();
  const brandPrefix = brand === 'Peritus' ? 'PER' : 'CNP';
  const prefix = `${brandPrefix}-${year}-`;

  if (!latestCode || !latestCode.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  const numStr = latestCode.replace(prefix, '');
  const nextNum = parseInt(numStr, 10) + 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';
    const status = searchParams.get('status') || '';
    const discipline = searchParams.get('discipline') || '';
    const brand = searchParams.get('brand') || '';
    const search = searchParams.get('search') || '';
    const deadlineFilter = searchParams.get('deadlineFilter') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Portal clients can only see their own cases
    if (userRole === 'cliente') {
      const clientId = await getClientIdForUser(userId);
      if (!clientId) {
        return NextResponse.json({ success: true, data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } });
      }
      const list = await cases.listCasesForClient(clientId);
      return NextResponse.json({ success: true, data: list, meta: { total: list.length, page: 1, limit: list.length, totalPages: 1 } });
    }

    // Financiero users can only see cases assigned to them
    const financieroId = userRole === 'financiero' ? userId : '';

    // Calculate deadline threshold based on filter
    let deadlineThreshold = '';
    if (deadlineFilter === 'proximos') {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      deadlineThreshold = d.toISOString().split('T')[0];
    } else if (deadlineFilter === 'urgente') {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      deadlineThreshold = d.toISOString().split('T')[0];
    }

    const filters = { status, discipline, brand, search, deadlineThreshold, financieroId };

    const [list, total] = await Promise.all([
      cases.listCases({ ...filters, limit, offset }),
      cases.countCases(filters),
    ]);

    return NextResponse.json({
      success: true,
      data: list,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo casos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name') || 'Sistema';
    const body = await request.json();
    const {
      title, description, discipline, complexity, priority,
      clientId, estimatedAmount, hasHearing, hearingDate, hearingLink, deadlineDate,
      city, courtName, caseNumber, brand: bodyBrand,
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'El titulo es requerido' }, { status: 400 });
    }
    if (discipline && !CASE_DISCIPLINES.includes(discipline)) {
      return NextResponse.json({ success: false, error: 'Disciplina no valida' }, { status: 400 });
    }
    if (complexity && !CASE_COMPLEXITIES.includes(complexity)) {
      return NextResponse.json({ success: false, error: 'Complejidad no valida' }, { status: 400 });
    }
    if (priority && !CASE_PRIORITIES.includes(priority)) {
      return NextResponse.json({ success: false, error: 'Prioridad no valida' }, { status: 400 });
    }

    // Validate Peritus client approval before case creation
    if (clientId) {
      const clientInfo = await crmClient.getClientById(clientId);
      if (clientInfo?.brand === 'Peritus' && clientInfo?.peritusRegistro?.estadoDocumentacion !== 'aprobado') {
        return NextResponse.json(
          { success: false, error: 'No se puede crear un caso para un cliente Peritus que no ha sido aprobado' },
          { status: 400 }
        );
      }
    }

    const caseBrand = bodyBrand === 'Peritus' ? 'Peritus' : 'CNP';

    // Generate case code with brand prefix
    const year = new Date().getFullYear();
    const brandPrefix = caseBrand === 'Peritus' ? 'PER' : 'CNP';
    const prefix = `${brandPrefix}-${year}-`;
    const latest = await cases.getLatestCaseCode(prefix);
    const caseCode = generateCaseCode(latest, caseBrand);

    const created = await cases.createCase({
      brand: caseBrand,
      caseCode,
      title,
      description: description || '',
      discipline: discipline || 'otro',
      status: 'creado',
      complexity: complexity || 'media',
      priority: priority || 'normal',
      estimatedAmount: estimatedAmount || 0,
      hasHearing: hasHearing || false,
      hearingDate: hearingDate || null,
      hearingLink: hearingLink || '',
      deadlineDate: deadlineDate || null,
      city: city || '',
      courtName: courtName || '',
      caseNumber: caseNumber || '',
      riskScore: 0,
      clientId: clientId || null,
      createdById: userId && userId !== 'admin' ? userId : null,
      commercialId: userId && userId !== 'admin' ? userId : null,
    });

    if (!created) {
      return NextResponse.json({ success: false, error: 'Error creando caso' }, { status: 500 });
    }

    // Auto-transfer WhatsApp lead documents if client was converted from a lead
    if (clientId) {
      try {
        const leadDocs = await query<{
          file_url: string | null; file_asset_id: string | null;
          file_name: string | null; mime_type: string | null; file_size: number | null;
        }>(
          `SELECT d.file_url, d.file_asset_id, d.file_name, d.mime_type, d.file_size
           FROM whatsapp_lead_document d
           JOIN whatsapp_lead l ON l.id = d.lead_id
           WHERE l.converted_client_id = $1 AND l.status = 'convertido'
           ORDER BY d.sort_order`,
          [clientId]
        );

        for (const ld of leadDocs) {
          if (!ld.file_asset_id) continue;
          await caseDocument.createCaseDocument({
            caseId: created._id,
            category: 'soporte_tecnico',
            fileUrl: ld.file_url,
            fileAssetId: ld.file_asset_id,
            fileName: ld.file_name || 'documento',
            mimeType: ld.mime_type || 'application/octet-stream',
            fileSize: ld.file_size || 0,
            version: 1,
            isVisibleToClient: true,
            description: 'Documento recibido por WhatsApp',
            uploadedById: userId && userId !== 'admin' ? userId : null,
            uploadedByName: userName,
          });
        }
      } catch (docErr) {
        console.error('[cases] Auto-transfer WhatsApp docs error:', docErr);
      }
    }

    triggerEvent('case:created', { id: created._id });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando caso' },
      { status: 500 }
    );
  }
}
