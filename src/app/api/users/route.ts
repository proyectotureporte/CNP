import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';

const listActiveUsersQuery = `*[_type == "crmUser" && active == true] | order(role asc, displayName asc) {
  _id, displayName, role
}`;

export async function GET() {
  try {
    const users = await client.fetch(listActiveUsersQuery);
    return NextResponse.json({ success: true, data: users });
  } catch {
    return NextResponse.json({ success: false, error: 'Error obteniendo usuarios' }, { status: 500 });
  }
}
