import { NextRequest, NextResponse } from 'next/server'

/**
 * Gate server-to-server para las APIs de contenido/blog administradas desde
 * el panel /santiago de total: header x-content-secret === CONTENT_ADMIN_SECRET.
 * Si la env no está configurada, la vía queda cerrada (nunca abierta).
 */
export function requireContentSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.CONTENT_ADMIN_SECRET ?? ''
  const provided = request.headers.get('x-content-secret') ?? ''
  if (!secret || provided !== secret) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401 },
    )
  }
  return null
}
