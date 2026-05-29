import { NextRequest, NextResponse } from 'next/server';
import { evaluation } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      evaluation.listAllEvaluations(limit, offset),
      evaluation.countAllEvaluations(),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo evaluaciones' }, { status: 500 });
  }
}
