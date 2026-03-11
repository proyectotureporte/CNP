import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { listAllDeliverablesQuery, countAllDeliverablesQuery } from '@/lib/sanity/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const phase = searchParams.get('phase') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const start = (page - 1) * limit;
    const end = start + limit;

    const [data, total] = await Promise.all([
      client.fetch(listAllDeliverablesQuery, { status, phase, start, end }),
      client.fetch(countAllDeliverablesQuery, { status, phase }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo entregas' },
      { status: 500 }
    );
  }
}
