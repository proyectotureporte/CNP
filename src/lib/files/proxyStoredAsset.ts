import { NextResponse } from 'next/server';

const ALLOWED_ASSET_HOSTS = new Set(['cdn.sanity.io']);

function safeDownloadName(value: string): string {
  return value.replace(/[\r\n"\\/]/g, '_').slice(0, 180) || 'archivo';
}

/**
 * Descarga desde el CDN en el servidor y retransmite el contenido. El navegador
 * nunca recibe la URL persistente, por lo que cada descarga vuelve a validar rol,
 * pertenencia al caso y estado del documento.
 */
export async function proxyStoredAsset(input: {
  fileUrl: string | null;
  fileName?: string | null;
  mimeType?: string | null;
}): Promise<Response> {
  if (!input.fileUrl) {
    return NextResponse.json({ success: false, error: 'Archivo no disponible' }, { status: 404 });
  }

  let url: URL;
  try {
    url = new URL(input.fileUrl);
  } catch {
    return NextResponse.json({ success: false, error: 'Archivo no disponible' }, { status: 404 });
  }

  if (url.protocol !== 'https:' || !ALLOWED_ASSET_HOSTS.has(url.hostname)) {
    return NextResponse.json({ success: false, error: 'Origen de archivo no permitido' }, { status: 403 });
  }

  const upstream = await fetch(url, { redirect: 'error', cache: 'no-store' });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ success: false, error: 'No fue posible descargar el archivo' }, { status: 502 });
  }

  const fileName = safeDownloadName(input.fileName || 'archivo');
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': input.mimeType || upstream.headers.get('content-type') || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
