import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listCasesQuery, countCasesQuery, getLatestCaseCodeQuery, listCasesForClientQuery } from '@/lib/sanity/queries';
import { getClientIdForUser } from '@/lib/auth/clientAccess';
import { CASE_STATUSES, CASE_DISCIPLINES, CASE_COMPLEXITIES, CASE_PRIORITIES } from '@/lib/types';
import type { CaseExpanded } from '@/lib/types';
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
    const start = (page - 1) * limit;
    const end = start + limit;

    // Portal clients can only see their own cases
    if (userRole === 'cliente') {
      const clientId = await getClientIdForUser(userId);
      if (!clientId) {
        return NextResponse.json({ success: true, data: [], meta: { total: 0, page: 1, limit, totalPages: 0 } });
      }
      const cases = await client.fetch<CaseExpanded[]>(listCasesForClientQuery, { clientId });
      return NextResponse.json({ success: true, data: cases, meta: { total: cases.length, page: 1, limit: cases.length, totalPages: 1 } });
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

    const queryParams = { status, discipline, brand, search, deadlineFilter, deadlineThreshold, start, end, financieroId };

    const [cases, total] = await Promise.all([
      client.fetch<CaseExpanded[]>(listCasesQuery, queryParams),
      client.fetch<number>(countCasesQuery, queryParams),
    ]);

    return NextResponse.json({
      success: true,
      data: cases,
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
    const body = await request.json();
    const {
      title, description, discipline, complexity, priority,
      clientId, estimatedAmount, hasHearing, hearingDate, hearingLink, deadlineDate,
      city, courtName, caseNumber, brand: bodyBrand,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'El titulo es requerido' },
        { status: 400 }
      );
    }

    if (discipline && !CASE_DISCIPLINES.includes(discipline)) {
      return NextResponse.json(
        { success: false, error: 'Disciplina no valida' },
        { status: 400 }
      );
    }

    if (complexity && !CASE_COMPLEXITIES.includes(complexity)) {
      return NextResponse.json(
        { success: false, error: 'Complejidad no valida' },
        { status: 400 }
      );
    }

    if (priority && !CASE_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { success: false, error: 'Prioridad no valida' },
        { status: 400 }
      );
    }

    const caseBrand = bodyBrand === 'Peritus' ? 'Peritus' : 'CNP';

    // Generate case code with brand prefix
    const year = new Date().getFullYear();
    const brandPrefix = caseBrand === 'Peritus' ? 'PER' : 'CNP';
    const prefix = `${brandPrefix}-${year}-`;
    const latest = await client.fetch<{ caseCode: string } | null>(getLatestCaseCodeQuery, { prefix });
    const caseCode = generateCaseCode(latest?.caseCode || null, caseBrand);

    const doc: { _type: 'case'; [key: string]: unknown } = {
      _type: 'case',
      brand: caseBrand,
      caseCode,
      title,
      description: description || '',
      discipline: discipline || 'otro',
      status: CASE_STATUSES[0], // 'creado'
      complexity: complexity || 'media',
      priority: priority || 'normal',
      estimatedAmount: estimatedAmount || 0,
      hasHearing: hasHearing || false,
      hearingDate: hearingDate || undefined,
      hearingLink: hearingLink || '',
      deadlineDate: deadlineDate || undefined,
      city: city || '',
      courtName: courtName || '',
      caseNumber: caseNumber || '',
      riskScore: 0,
    };

    if (clientId) {
      doc.client = { _type: 'reference', _ref: clientId };
    }

    if (userId && userId !== 'admin') {
      doc.createdBy = { _type: 'reference', _ref: userId };
      doc.commercial = { _type: 'reference', _ref: userId };
    }

    const created = await writeClient.create(doc);

    // Auto-transfer WhatsApp lead documents if client was converted from a lead
    if (clientId) {
      try {
        const lead = await client.fetch<{
          _id: string;
          documents?: { fileName: string; mimeType: string; file?: { asset?: { _ref?: string } } }[];
        } | null>(
          `*[_type == "whatsappLead" && convertedClient._ref == $clientId && status == "convertido"][0]{
            _id, documents[]{ fileName, mimeType, file{ asset{ _ref } } }
          }`,
          { clientId }
        );

        if (lead?.documents?.length) {
          const userName = request.headers.get('x-user-name') || 'Sistema';
          for (const leadDoc of lead.documents) {
            if (leadDoc.file?.asset?._ref) {
              await writeClient.create({
                _type: 'caseDocument',
                case: { _type: 'reference', _ref: created._id },
                category: 'soporte_tecnico',
                fileName: leadDoc.fileName || 'documento',
                fileSize: 0,
                mimeType: leadDoc.mimeType || 'application/octet-stream',
                version: 1,
                isVisibleToClient: true,
                description: 'Documento recibido por WhatsApp',
                uploadedByName: userName,
                ...(userId && userId !== 'admin' ? { uploadedBy: { _type: 'reference', _ref: userId } } : {}),
                file: { _type: 'file', asset: { _type: 'reference', _ref: leadDoc.file.asset._ref } },
              });
            }
          }
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
