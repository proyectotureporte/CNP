import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { listAllEvaluationsQuery, countAllEvaluationsQuery } from '@/lib/sanity/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const start = (page - 1) * limit;
    const end = start + limit;

    const [data, total] = await Promise.all([
      client.fetch(listAllEvaluationsQuery, { start, end }),
      client.fetch(countAllEvaluationsQuery),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo evaluaciones' },
      { status: 500 }
    );
  }
}
