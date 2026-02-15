"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Download, Eye, EyeOff, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type CaseDocument,
  type DocumentCategory,
} from "@/lib/types";
import DocumentUpload from "./DocumentUpload";

interface DocumentListProps {
  caseId: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType?.includes("word") || mimeType?.includes("document")) return "📝";
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) return "📊";
  return "📎";
}

export default function DocumentList({ caseId }: DocumentListProps) {
  const [documents, setDocuments] = useState<(CaseDocument & { fileUrl?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await fetch(`/api/cases/${caseId}/documents?${params}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [caseId, categoryFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleToggleVisibility(docId: string, current: boolean) {
    try {
      await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisibleToClient: !current }),
      });
      fetchDocuments();
    } catch {
      // Ignore
    }
  }

  async function handleDelete(docId: string) {
    if (!window.confirm("Eliminar este documento?")) return;
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      fetchDocuments();
    } catch {
      // Ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <DocumentUpload caseId={caseId} onSuccess={fetchDocuments} />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas las categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorias</SelectItem>
            {DOCUMENT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{DOCUMENT_CATEGORY_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{documents.length} documentos</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
              <Skeleton className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <FileText className="mx-auto h-8 w-8 mb-2" />
          No hay documentos
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc._id} className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
              <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.fileName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">
                    {DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory] || doc.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                  <span className="text-xs text-muted-foreground">
                    {doc.uploadedByName || doc.uploadedBy?.displayName || "Sistema"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc._createdAt).toLocaleDateString("es-CO")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleVisibility(doc._id, doc.isVisibleToClient)}
                  title={doc.isVisibleToClient ? "Ocultar al cliente" : "Mostrar al cliente"}
                >
                  {doc.isVisibleToClient ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                {doc.fileUrl && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" title="Descargar">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc._id)}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
