import { NextRequest, NextResponse } from 'next/server';
import { whatsappLead } from '@/lib/db';
import { guardRole } from '@/lib/auth/guard';

export async function GET(request: NextRequest) {
  try {
    const stop = guardRole(request, (role) => ['admin', 'juridico', 'mercadeo'].includes(role));
    if (stop) return stop;
    const search = request.nextUrl.searchParams.get('search') || '';
    const brand = request.nextUrl.searchParams.get('brand') || '';
    const status = request.nextUrl.searchParams.get('status') || '';

    const [leads, counts] = await Promise.all([
      whatsappLead.listWhatsappLeads(brand, status, search),
      whatsappLead.countWhatsappLeadsByBrand(),
    ]);

    return NextResponse.json({ success: true, data: leads, counts });
  } catch (err) {
    console.error('[whatsapp/leads] GET error:', err);
    return NextResponse.json({ success: false, error: 'Error obteniendo leads' }, { status: 500 });
  }
}
