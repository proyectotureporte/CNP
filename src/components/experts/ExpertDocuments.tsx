"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Eye, FileText, FolderOpen, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { usePusher } from "@/hooks/usePusher";
import {
  EXPERT_DOCUMENT_MAX_BYTES,
  EXPERT_DOCUMENT_TYPES,
  EXPERT_DOCUMENT_TYPE_LABELS,
  type ExpertDocument,
  type ExpertDocumentType,
} from "@/lib/types";

interface CvInfo {
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  downloadUrl: string;
  viewUrl: string;
}

interface DocumentsPayload {
  cv: CvInfo | null;
  documents: ExpertDocument[];
}

interface ExpertDocumentsProps {
  /** `/api/experts/{id}/documents` (CRM) o `/api/expert/profile/documents` (perito). */
  endpoint: string;
  /** Puede subir y eliminar documentos. */
  canManage: boolean;
  /** Puede eliminar la hoja de vida (solo CRM; el perito la reemplaza). */
  canDeleteCv?: boolean;
  title?: string;
}

const VIEWABLE = /^(application\/pdf|image\/(png|jpeg|webp|gif)|text\/plain)/i;

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

type PendingDelete = { id: string; name: string } | null;

function FileRow({ name, mimeType, size, meta, viewUrl, downloadUrl, onDelete }: {
  name: string; mimeType: string | null; size: number | null; meta?: string;
  viewUrl: string; downloadUrl: string; onDelete?: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={name}>{name}</p>
        <p className="text-xs text-muted-foreground">{[formatSize(size), meta].filter(Boolean).join(" · ")}</p>
      </div>
      <div className="flex items-center gap-1">
        {mimeType && VIEWABLE.test(mimeType) && (
          <Button type="button" variant="ghost" size="sm" asChild>
            <a href={viewUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${name}`}><Eye className="h-4 w-4" /></a>
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" asChild>
          <a href={downloadUrl} aria-label={`Descargar ${name}`}><Download className="h-4 w-4" /></a>
        </Button>
        {onDelete && (
          <Button
            type="button" variant="ghost" size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={onDelete}
            aria-label={`Eliminar ${name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </li>
  );
}

export default function ExpertDocuments({ endpoint, canManage, canDeleteCv = false, title = "Documentación" }: ExpertDocumentsProps) {
  const [data, setData] = useState<DocumentsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<{ type: ExpertDocumentType; done: number; total: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [deleting, setDeleting] = useState(false);
  const inputs = useRef<Partial<Record<ExpertDocumentType, HTMLInputElement | null>>>({});

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint);
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "No fue posible cargar los documentos");
      setData(payload.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);
  usePusher(["expert:updated"], () => { load(); });

  // Un archivo por petición: cada uno respeta el límite de 50 MB sin sumar el lote.
  async function upload(type: ExpertDocumentType, files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const tooBig = list.filter((file) => file.size > EXPERT_DOCUMENT_MAX_BYTES);
    if (tooBig.length > 0) {
      setError(`Supera el máximo de 50 MB por archivo: ${tooBig.map((file) => file.name).join(", ")}`);
      return;
    }
    setError("");
    setUploading({ type, done: 0, total: list.length });
    const failed: string[] = [];
    for (const [index, file] of list.entries()) {
      const form = new FormData();
      form.append("docType", type);
      form.append("file", file);
      try {
        const response = await fetch(endpoint, { method: "POST", body: form });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) failed.push(`${file.name}${payload.error ? ` (${payload.error})` : ""}`);
      } catch {
        failed.push(file.name);
      }
      setUploading({ type, done: index + 1, total: list.length });
    }
    setUploading(null);
    if (failed.length > 0) setError(`No se pudieron subir: ${failed.join(", ")}`);
    await load();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`${endpoint}/${pendingDelete.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "No fue posible eliminar el archivo");
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando documentos...</div>
        ) : (
          <>
            <section className="space-y-2">
              <h4 className="text-sm font-semibold">Hoja de vida</h4>
              {data?.cv ? (
                <ul>
                  <FileRow
                    name={data.cv.fileName || "Hoja de vida"}
                    mimeType={data.cv.mimeType}
                    size={data.cv.fileSize}
                    viewUrl={data.cv.viewUrl}
                    downloadUrl={data.cv.downloadUrl}
                    onDelete={canDeleteCv ? () => setPendingDelete({ id: "cv", name: data.cv?.fileName || "Hoja de vida" }) : undefined}
                  />
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sin hoja de vida cargada.</p>
              )}
            </section>

            {EXPERT_DOCUMENT_TYPES.map((type) => {
              const docs = data?.documents.filter((document) => document.docType === type) ?? [];
              const busy = uploading?.type === type;
              return (
                <section key={type} className="space-y-2 border-t pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      {EXPERT_DOCUMENT_TYPE_LABELS[type]}
                      <Badge variant="secondary">{docs.length}</Badge>
                    </h4>
                    {canManage && (
                      <>
                        <input
                          ref={(element) => { inputs.current[type] = element; }}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(event) => { upload(type, event.target.files); event.target.value = ""; }}
                        />
                        <Button
                          type="button" variant="outline" size="sm"
                          disabled={!!uploading}
                          onClick={() => inputs.current[type]?.click()}
                        >
                          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {busy ? `Subiendo ${uploading.done}/${uploading.total}` : "Subir archivos"}
                        </Button>
                      </>
                    )}
                  </div>
                  {docs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin archivos.</p>
                  ) : (
                    <ul className="space-y-2">
                      {docs.map((document) => (
                        <FileRow
                          key={document._id}
                          name={document.fileName || "Archivo"}
                          mimeType={document.mimeType}
                          size={document.fileSize}
                          meta={`${formatDate(document._createdAt)}${document.uploadedByName ? ` · ${document.uploadedByName}` : ""}`}
                          viewUrl={document.viewUrl || ""}
                          downloadUrl={document.downloadUrl || ""}
                          onDelete={canManage ? () => setPendingDelete({ id: document._id, name: document.fileName || "Archivo" }) : undefined}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
            {canManage && (
              <p className="text-xs text-muted-foreground">Cualquier formato (foto, PDF, Word…). Puedes seleccionar varios archivos a la vez; máximo 50 MB por archivo.</p>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar archivo</DialogTitle>
            <DialogDescription>
              Se eliminará definitivamente &quot;{pendingDelete?.name}&quot;. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
