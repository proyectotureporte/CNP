"use client";

import { useState, useRef, type DragEvent } from "react";
import { Upload, X, File as FileIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
} from "@/lib/types";
import {
  CASE_DOCUMENT_ACCEPT_ATTRIBUTE,
  CASE_DOCUMENT_ALLOWED_LABEL,
  CASE_DOCUMENT_MAX_FILES_PER_UPLOAD,
  CASE_DOCUMENT_MAX_SIZE_MB,
  validateDocumentFiles,
} from "@/lib/files/uploadLimits";

interface DocumentUploadProps {
  caseId: string;
  onSuccess: () => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUpload({ caseId, onSuccess }: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("documentos_caso");
  const [description, setDescription] = useState("");
  const [visibleToClient, setVisibleToClient] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | File[] | null) {
    const list = Array.from(incoming ?? []);
    if (list.length === 0) return;
    const merged = [...files, ...list.filter((f) => !files.some((existing) => existing.name === f.name && existing.size === f.size))];
    const problem = validateDocumentFiles(merged);
    if (problem) {
      setError(problem);
      return;
    }
    setFiles(merged);
    setError("");
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("category", category);
      formData.append("description", description);
      formData.append("isVisibleToClient", visibleToClient ? "true" : "false");

      const res = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Error al subir documento");
        return;
      }

      setFiles([]);
      setCategory("documentos_caso");
      setDescription("");
      setVisibleToClient(false);
      onSuccess();
    } catch {
      setError("Error de conexion");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={CASE_DOCUMENT_ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Arrastra uno o varios archivos o haz clic para seleccionar
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {CASE_DOCUMENT_ALLOWED_LABEL} · hasta {CASE_DOCUMENT_MAX_FILES_PER_UPLOAD} archivos de máximo {CASE_DOCUMENT_MAX_SIZE_MB} MB cada uno
        </p>
      </div>

      {files.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`} className="flex items-center gap-3 px-3 py-2">
              <FileIcon className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Quitar ${file.name}`}
                onClick={() => setFiles((prev) => prev.filter((item) => item !== file))}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Category + Description */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{DOCUMENT_CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-desc">Descripcion</Label>
              <Input
                id="doc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripcion..."
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={visibleToClient} onCheckedChange={(value) => setVisibleToClient(value === true)} />
            Visible para el cliente en su portal
          </label>
          <p className="text-xs text-muted-foreground">
            Lo que carga el equipo queda aprobado y, salvo que marques la casilla, oculto para el cliente.
          </p>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo {files.length} archivo(s)...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir {files.length === 1 ? "documento" : `${files.length} documentos`}
              </>
            )}
          </Button>
        </div>
      )}
      {error && files.length === 0 && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
