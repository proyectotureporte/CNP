export const CASE_DOCUMENT_MAX_SIZE_MB = 50;
export const CASE_DOCUMENT_MAX_SIZE_BYTES = CASE_DOCUMENT_MAX_SIZE_MB * 1024 * 1024;

/** Máximo de archivos por envío (CRM, portal y enlace público). */
export const CASE_DOCUMENT_MAX_FILES_PER_UPLOAD = 10;

/**
 * Formatos admitidos en el expediente: PDF, Word, Excel, PowerPoint, texto e
 * imágenes. La validación se hace por extensión porque el MIME que envía el
 * navegador no es fiable (p. ej. `application/octet-stream` para .docx).
 */
export const CASE_DOCUMENT_ALLOWED_EXTENSIONS = [
  'pdf',
  'doc', 'docx', 'rtf', 'odt',
  'xls', 'xlsx', 'csv', 'ods',
  'ppt', 'pptx',
  'txt',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif', 'tif', 'tiff',
] as const;

/** Valor para el atributo `accept` de los inputs de archivo. */
export const CASE_DOCUMENT_ACCEPT_ATTRIBUTE = CASE_DOCUMENT_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

export const CASE_DOCUMENT_ALLOWED_LABEL = 'PDF, Word, Excel, PowerPoint, texto e imágenes';

export function fileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? '' : fileName.slice(idx + 1).toLowerCase();
}

export function isAllowedDocumentFile(fileName: string): boolean {
  return (CASE_DOCUMENT_ALLOWED_EXTENSIONS as readonly string[]).includes(fileExtension(fileName));
}

/**
 * Valida un lote de archivos (cantidad, formato y tamaño). Devuelve el mensaje
 * de error o null si todo es válido.
 */
export function validateDocumentFiles(files: Array<{ name: string; size: number }>): string | null {
  if (files.length === 0) return 'Selecciona al menos un archivo';
  if (files.length > CASE_DOCUMENT_MAX_FILES_PER_UPLOAD) {
    return `Puedes enviar máximo ${CASE_DOCUMENT_MAX_FILES_PER_UPLOAD} archivos a la vez`;
  }
  for (const file of files) {
    if (!isAllowedDocumentFile(file.name)) {
      return `"${file.name}" no tiene un formato admitido (${CASE_DOCUMENT_ALLOWED_LABEL})`;
    }
    if (file.size === 0) return `"${file.name}" está vacío`;
    if (file.size > CASE_DOCUMENT_MAX_SIZE_BYTES) {
      return `"${file.name}" excede el límite de ${CASE_DOCUMENT_MAX_SIZE_MB} MB`;
    }
  }
  return null;
}
