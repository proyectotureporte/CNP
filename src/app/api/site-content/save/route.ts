// Guarda overrides de contenido de una página pública (desde /santiago).
// POST {page, valor}. Server-to-server con x-content-secret.
import { NextRequest, NextResponse } from 'next/server'
import { requireContentSecret } from '@/lib/content/secret'
import { getPaginaCnp } from '@/lib/content/registry'
import { siteContent } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const stop = requireContentSecret(request)
  if (stop) return stop
  try {
    const body = await request.json()
    const page = String(body.page ?? '')
    const valor = body.valor
    if (!page || typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
      return NextResponse.json(
        { success: false, error: 'page y valor (objeto) son requeridos' },
        { status: 400 },
      )
    }
    if (!getPaginaCnp(page)) {
      return NextResponse.json({ success: false, error: 'Página no encontrada' }, { status: 404 })
    }
    await siteContent.setSiteContent('cnp', page, valor as Record<string, unknown>)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error site-content/save:', e)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
