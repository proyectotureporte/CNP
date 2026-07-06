// CRUD del blog (gestionado desde /seguimiento → Blog en total).
// Server-to-server con x-content-secret. El público lee el blog vía las
// páginas /blog y /masterclass (server-side, sin esta API).
import { NextRequest, NextResponse } from 'next/server'
import { requireContentSecret } from '@/lib/content/secret'
import { blogPost } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const stop = requireContentSecret(request)
  if (stop) return stop
  try {
    const posts = await blogPost.listTodos()
    return NextResponse.json({ success: true, posts })
  } catch (e) {
    console.error('Error blog/admin GET:', e)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const stop = requireContentSecret(request)
  if (stop) return stop
  try {
    const body = await request.json()
    if (!body.titulo || typeof body.titulo !== 'string') {
      return NextResponse.json({ success: false, error: 'titulo es requerido' }, { status: 400 })
    }
    const post = await blogPost.createPost({
      titulo: body.titulo,
      extracto: body.extracto,
      categoria: body.categoria,
      imagenUrl: body.imagenUrl,
      contenidoHtml: body.contenidoHtml,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      publicado: body.publicado,
      fechaPublicacion: body.fechaPublicacion ?? null,
    })
    return NextResponse.json({ success: true, post })
  } catch (e) {
    console.error('Error blog/admin POST:', e)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const stop = requireContentSecret(request)
  if (stop) return stop
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'id es requerido' }, { status: 400 })
    }
    const post = await blogPost.updatePost(String(body.id), {
      titulo: body.titulo,
      extracto: body.extracto,
      categoria: body.categoria,
      imagenUrl: body.imagenUrl,
      contenidoHtml: body.contenidoHtml,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      publicado: body.publicado,
      fechaPublicacion: body.fechaPublicacion ?? null,
    })
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true, post })
  } catch (e) {
    console.error('Error blog/admin PUT:', e)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const stop = requireContentSecret(request)
  if (stop) return stop
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') ?? ''
    if (!id) {
      return NextResponse.json({ success: false, error: 'id es requerido' }, { status: 400 })
    }
    const deleted = await blogPost.deletePost(id)
    return NextResponse.json({ success: true, deleted })
  } catch (e) {
    console.error('Error blog/admin DELETE:', e)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
