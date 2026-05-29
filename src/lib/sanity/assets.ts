import { writeClient } from './client';

export interface UploadedAsset {
  assetId: string;
  url: string;
  originalFilename: string | null;
  size: number | null;
  mimeType: string | null;
}

/**
 * Sube un archivo al CDN de Sanity (los archivos siguen en Sanity tras la
 * migración a PostgreSQL). Devuelve los metadatos que se guardan en PG:
 * assetId, url, originalFilename, size, mimeType.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType = 'application/octet-stream',
): Promise<UploadedAsset> {
  const asset = await writeClient.assets.upload('file', buffer, { filename, contentType });
  return {
    assetId: asset._id,
    url: asset.url,
    originalFilename: asset.originalFilename ?? filename,
    size: asset.size ?? null,
    mimeType: asset.mimeType ?? contentType,
  };
}

/** Borra un asset de Sanity por su id. No bloqueante. */
export async function deleteAsset(assetId: string): Promise<void> {
  try {
    await writeClient.delete(assetId);
  } catch {
    // no bloqueante
  }
}
