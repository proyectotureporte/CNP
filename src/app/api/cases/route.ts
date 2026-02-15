import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listCasesQuery, countCasesQuery, getLatestCaseCodeQuery } from '@/lib/sanity/queries';
import { CASE_STATUSES, CASE_DISCIPLINES, CASE_COMPLEXITIES, CASE_PRIORITIES } from '@/lib/types';
import type { CaseExpanded } from '@/lib/types';

function generateCaseCode(latestCode: string | null): string {
  const year = new Date().getFullYear();
  const prefix = `CNP-${year}-`;

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
    const status = searchParams.get('status') || '';
    const discipline = searchParams.get('discipline') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const start = (page - 1) * limit;
    const end = start + limit;

    const [cases, total] = await Promise.all([
      client.fetch<CaseExpanded[]>(listCasesQuery, { status, discipline, search, start, end }),
      client.fetch<number>(countCasesQuery, { status, discipline, search }),
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
      clientId, estimatedAmount, hearingDate, deadlineDate,
      city, courtName, caseNumber,
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

    // Generate case code
    const year = new Date().getFullYear();
    const prefix = `CNP-${year}-`;
    const latest = await client.fetch<{ caseCode: string } | null>(getLatestCaseCodeQuery, { prefix });
    const caseCode = generateCaseCode(latest?.caseCode || null);

    const doc: { _type: 'case'; [key: string]: unknown } = {
      _type: 'case',
      caseCode,
      title,
      description: description || '',
      discipline: discipline || 'otro',
      status: CASE_STATUSES[0], // 'creado'
      complexity: complexity || 'media',
      priority: priority || 'normal',
      estimatedAmount: estimatedAmount || 0,
      hearingDate: hearingDate || undefined,
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

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando caso' },
      { status: 500 }
    );
  }
}
