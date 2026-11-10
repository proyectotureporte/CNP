import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export { canPreviewDocument, isOfficeDocument } from './previewTypes';

// Vista previa de Word / Excel / PowerPoint: conversión a PDF en el servidor
// con LibreOffice headless (soffice). El PDF se guarda en caché por documento
// y versión; los archivos nunca salen del VPS.

const CONVERT_TIMEOUT_MS = 90_000;

function cacheDir(): string {
  return process.env.PREVIEW_CACHE_DIR || path.join(os.tmpdir(), 'cnp-previews');
}

// LibreOffice no admite dos instancias con el mismo perfil: se serializan las conversiones.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

function runSoffice(inputPath: string, outDir: string, profileDir: string): Promise<void> {
  const binary = process.env.SOFFICE_BIN || 'soffice';
  return new Promise((resolve, reject) => {
    execFile(
      binary,
      [
        `-env:UserInstallation=file://${profileDir}`,
        '--headless', '--norestore', '--nologo', '--nolockcheck',
        '--convert-to', 'pdf', '--outdir', outDir, inputPath,
      ],
      { timeout: CONVERT_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
      (error, _stdout, stderr) => {
        if (error) reject(new Error(`soffice: ${error.message} ${stderr || ''}`.trim()));
        else resolve();
      },
    );
  });
}

/**
 * Devuelve el PDF (bytes) de un documento de oficina, convirtiéndolo con
 * LibreOffice la primera vez y leyéndolo de caché después. `cacheKey` debe
 * cambiar cuando cambie el archivo (id + asset).
 */
export async function getOfficePreviewPdf(input: {
  cacheKey: string;
  fileName: string;
  fetchSource: () => Promise<Buffer>;
}): Promise<Buffer> {
  const dir = cacheDir();
  await fs.mkdir(dir, { recursive: true });
  const key = createHash('sha256').update(input.cacheKey).digest('hex').slice(0, 40);
  const cached = path.join(dir, `${key}.pdf`);
  try {
    return await fs.readFile(cached);
  } catch {
    // no está en caché: convertir
  }

  return enqueue(async () => {
    try {
      return await fs.readFile(cached);
    } catch {
      // seguir con la conversión
    }
    const work = await fs.mkdtemp(path.join(dir, 'work-'));
    try {
      const ext = (input.fileName.toLowerCase().split('.').pop() || 'bin').replace(/[^a-z0-9]/g, '') || 'bin';
      const inputPath = path.join(work, `source.${ext}`);
      await fs.writeFile(inputPath, await input.fetchSource());
      const profileDir = path.join(dir, 'lo-profile');
      await fs.mkdir(profileDir, { recursive: true });
      await runSoffice(inputPath, work, profileDir);
      const produced = path.join(work, 'source.pdf');
      const pdf = await fs.readFile(produced);
      await fs.writeFile(cached, pdf);
      return pdf;
    } finally {
      fs.rm(work, { recursive: true, force: true }).catch(() => undefined);
    }
  });
}
