import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // En PostgreSQL la columna brand es NOT NULL DEFAULT 'CNP', así que no debería
    // haber casos sin brand. Se mantiene por compatibilidad con el flujo anterior.
    const updated = await query<{ id: string }>(`UPDATE cases SET brand = 'CNP' WHERE brand IS NULL RETURNING id`);

    return NextResponse.json({
      success: true,
      data: {
        updated: updated.length,
        message: updated.length
          ? `Se actualizaron ${updated.length} casos con brand "CNP"`
          : 'Todos los casos ya tienen brand asignado',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Error en migracion de brand' }, { status: 500 });
  }
}
