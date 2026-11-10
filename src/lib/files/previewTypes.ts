// Qué formatos tienen vista previa (módulo sin dependencias de Node: lo usan componentes cliente).

const OFFICE_EXTENSIONS = new Set(['doc', 'docx', 'rtf', 'odt', 'xls', 'xlsx', 'csv', 'ods', 'ppt', 'pptx', 'odp']);

export function isOfficeDocument(fileName?: string | null, mimeType?: string | null): boolean {
  const ext = (fileName || '').toLowerCase().split('.').pop() || '';
  if (OFFICE_EXTENSIONS.has(ext)) return true;
  const mime = (mimeType || '').toLowerCase();
  return mime.includes('msword') || mime.includes('officedocument') || mime.includes('ms-excel') || mime.includes('ms-powerpoint') || mime.includes('opendocument');
}

/** Tipos que el navegador muestra en línea por sí mismo o tras conversión a PDF. */
export function canPreviewDocument(fileName?: string | null, mimeType?: string | null): boolean {
  const mime = (mimeType || '').toLowerCase();
  if (mime === 'application/pdf' || mime === 'text/plain' || mime.startsWith('image/')) return true;
  const ext = (fileName || '').toLowerCase().split('.').pop() || '';
  if (['pdf', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return true;
  return isOfficeDocument(fileName, mimeType);
}

