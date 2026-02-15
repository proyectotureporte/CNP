import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') || 'crm';

  const response = NextResponse.json({ success: true });

  if (type === 'admin') {
    response.cookies.delete('admin-token');
  } else {
    response.cookies.delete('crm-token');
  }

  return response;
}
