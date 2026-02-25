import { NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity/client';

export async function POST() {
  try {
    // Find all cases that don't have a brand field defined
    const casesWithoutBrand = await client.fetch<{ _id: string }[]>(
      `*[_type == "case" && !defined(brand)]{ _id }`
    );

    if (casesWithoutBrand.length === 0) {
      return NextResponse.json({
        success: true,
        data: { updated: 0, message: 'Todos los casos ya tienen brand asignado' },
      });
    }

    // Patch each case to set brand = "CNP"
    const transaction = writeClient.transaction();
    for (const c of casesWithoutBrand) {
      transaction.patch(c._id, (patch) => patch.set({ brand: 'CNP' }));
    }
    await transaction.commit();

    return NextResponse.json({
      success: true,
      data: { updated: casesWithoutBrand.length, message: `Se actualizaron ${casesWithoutBrand.length} casos con brand "CNP"` },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error en migracion de brand' }, { status: 500 });
  }
}
