import { NextRequest, NextResponse } from 'next/server';
import { expert } from '@/lib/db';
import { triggerEvent } from '@/lib/realtime/server';
import { guardRole } from '@/lib/auth/guard';
import { canManageExperts } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const discipline = searchParams.get('discipline') || '';
    const city = searchParams.get('city') || '';
    const availability = searchParams.get('availability') || '';
    const validationStatus = searchParams.get('validationStatus') || '';
    const seniority = searchParams.get('seniority') || '';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const filters = { discipline, city, availability, validationStatus, seniority, category, search };

    const [experts, total] = await Promise.all([
      expert.listExperts({ ...filters, limit, offset }),
      expert.countExperts(filters),
    ]);

    return NextResponse.json({
      success: true,
      data: experts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo peritos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const stop = guardRole(request, canManageExperts);
    if (stop) return stop;

    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const {
      userRef, disciplines, specialization, subespecialidad, experienceYears, professionalCard,
      seniority, category, pregrado, numEspecializaciones, numMaestrias, doctorado,
      city, region, baseFee, feeCurrency, taxId,
      bankName, bankAccountType, bankAccountNumber,
    } = body;

    if (!disciplines || disciplines.length === 0) {
      return NextResponse.json({ success: false, error: 'Al menos una disciplina es requerida' }, { status: 400 });
    }

    const created = await expert.createExpert({
      userId: userRef || (userId && userId !== 'admin' ? userId : null),
      disciplines,
      specialization: specialization || '',
      subespecialidad: subespecialidad || '',
      experienceYears: experienceYears || 0,
      seniority: seniority || null,
      category: category || null,
      pregrado: pregrado ?? false,
      numEspecializaciones: numEspecializaciones ?? 0,
      numMaestrias: numMaestrias ?? 0,
      doctorado: doctorado ?? false,
      professionalCard: professionalCard || '',
      city: city || '',
      region: region || '',
      baseFee: baseFee || 0,
      feeCurrency: feeCurrency || 'COP',
      availability: 'disponible',
      validationStatus: 'candidato',
      taxId: taxId || '',
      bankName: bankName || '',
      bankAccountType: bankAccountType || null,
      bankAccountNumber: bankAccountNumber || '',
    });

    if (created) triggerEvent('expert:created', { id: created._id });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error creando perito' }, { status: 500 });
  }
}
