import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';
import { listExpertsQuery, countExpertsQuery } from '@/lib/sanity/queries';
import type { Expert } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const discipline = searchParams.get('discipline') || '';
    const city = searchParams.get('city') || '';
    const availability = searchParams.get('availability') || '';
    const validationStatus = searchParams.get('validationStatus') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const start = (page - 1) * limit;
    const end = start + limit;

    const params = { discipline, city, availability, validationStatus, search, start, end };

    const [experts, total] = await Promise.all([
      client.fetch<Expert[]>(listExpertsQuery, params),
      client.fetch<number>(countExpertsQuery, params),
    ]);

    return NextResponse.json({
      success: true,
      data: experts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo peritos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const {
      userRef, disciplines, specialization, experienceYears, professionalCard,
      city, region, baseFee, feeCurrency, taxId,
      bankName, bankAccountType, bankAccountNumber,
    } = body;

    if (!disciplines || disciplines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Al menos una disciplina es requerida' },
        { status: 400 }
      );
    }

    const doc: { _type: 'expert'; [key: string]: unknown } = {
      _type: 'expert',
      disciplines,
      specialization: specialization || '',
      experienceYears: experienceYears || 0,
      professionalCard: professionalCard || '',
      city: city || '',
      region: region || '',
      baseFee: baseFee || 0,
      feeCurrency: feeCurrency || 'COP',
      availability: 'disponible',
      rating: 0,
      totalCases: 0,
      completedCases: 0,
      validationStatus: 'pendiente',
      taxId: taxId || '',
      bankName: bankName || '',
      bankAccountType: bankAccountType || '',
      bankAccountNumber: bankAccountNumber || '',
    };

    // Link to user if provided, otherwise use current user
    const refId = userRef || (userId && userId !== 'admin' ? userId : null);
    if (refId) {
      doc.user = { _type: 'reference', _ref: refId };
    }

    const created = await writeClient.create(doc);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error creando perito' },
      { status: 500 }
    );
  }
}
