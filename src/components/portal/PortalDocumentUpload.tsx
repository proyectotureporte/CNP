'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, FileIcon } from 'lucide-react';

interface PortalDocumentUploadProps {
  caseId: string;
  onUploadComplete: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortalDocumentUpload({ caseId, onUploadComplete }: PortalDocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError('');
    if (f.size > MAX_FILE_SIZE) {
      setError('El archivo excede el limite de 10MB');
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);

      const res = await fetch(`/api/cases/${caseId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Error subiendo documento');
        return;
      }

      setFile(null);
      setDescription('');
      if (inputRef.current) inputRef.current.value = '';
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

      <div
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arrastra un archivo aqui o{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => inputRef.current?.click()}
              >
                selecciona
              </button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Maximo 10MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />
      </div>

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

      <Button type="submit" disabled={!file || uploading} className="w-full">
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Subir Documento
          </>
        )}
      </Button>
    </form>
  );
}
