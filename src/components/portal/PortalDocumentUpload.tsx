'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, FileIcon } from 'lucide-react';
import {
  CASE_DOCUMENT_ACCEPT_ATTRIBUTE,
  CASE_DOCUMENT_ALLOWED_LABEL,
  CASE_DOCUMENT_MAX_FILES_PER_UPLOAD,
  CASE_DOCUMENT_MAX_SIZE_MB,
  validateDocumentFiles,
} from '@/lib/files/uploadLimits';
import type { ClientPendingDocument } from '@/lib/types';

interface PortalDocumentUploadProps {
  caseId: string;
  onUploadComplete: () => void;
  /** Requeridos pendientes o devueltos: el cliente elige a cuál responde. */
  pendingDocuments?: ClientPendingDocument[];
  /** Preselección (p. ej. botón "Enviar" de un pendiente concreto). */
  initialTargetId?: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortalDocumentUpload({ caseId, onUploadComplete, pendingDocuments = [], initialTargetId = '' }: PortalDocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [targetId, setTargetId] = useState(initialTargetId);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[] | null) => {
    const list = Array.from(incoming ?? []);
    if (list.length === 0) return;
    setFiles((prev) => {
      const merged = [...prev, ...list.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size))];
      const problem = validateDocumentFiles(merged);
      if (problem) {
        setError(problem);
        return prev;
      }
      setError('');
      return merged;
    });
  }, []);

  const target = pendingDocuments.find((item) => item._id === targetId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('description', description);
      if (targetId) formData.append('documentId', targetId);

      const res = await fetch(`/api/cases/${caseId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Error subiendo documento');
        return;
      }

      setFiles([]);
      setDescription('');
      setTargetId('');
      if (inputRef.current) inputRef.current.value = '';
      setSuccess(`${data.count ?? files.length} archivo(s) enviado(s). El equipo los revisará y te avisará si necesita algo más.`);
      onUploadComplete();
    } catch {
      setError('Error de conexion');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      {pendingDocuments.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="doc-target" className="text-sm">¿A qué solicitud corresponde?</Label>
          <select
            id="doc-target"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={uploading}
          >
            <option value="">Documentación adicional / no está en la lista</option>
            {pendingDocuments.map((item) => (
              <option key={item._id} value={item._id}>
                {item.description}{item.reason === 'correccion' ? ' (versión corregida)' : ''}
              </option>
            ))}
          </select>
          {target?.reason === 'correccion' && target.reviewNote && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">Observación del equipo: {target.reviewNote}</p>
          )}
        </div>
      )}

      <div
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Arrastra uno o varios archivos aquí o{' '}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => inputRef.current?.click()}
          >
            selecciona
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {CASE_DOCUMENT_ALLOWED_LABEL} · hasta {CASE_DOCUMENT_MAX_FILES_PER_UPLOAD} archivos de máximo {CASE_DOCUMENT_MAX_SIZE_MB} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={CASE_DOCUMENT_ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {files.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`} className="flex items-center gap-3 px-3 py-2">
              <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label={`Quitar ${file.name}`}
                onClick={() => setFiles((prev) => prev.filter((item) => item !== file))}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {target && files.length > 1 && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
          El primer archivo atenderá “{target.description}”; los demás quedarán como anexos.
        </p>
      )}

      <div className="space-y-1">
        <Label htmlFor="doc-description" className="text-sm">Descripcion (opcional)</Label>
        <Input
          id="doc-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Breve descripcion del documento..."
          disabled={uploading}
        />
      </div>

      <Button type="submit" disabled={files.length === 0 || uploading} className="w-full">
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Enviar {files.length <= 1 ? 'documento' : `${files.length} documentos`}
          </>
        )}
      </Button>
    </form>
  );
}
