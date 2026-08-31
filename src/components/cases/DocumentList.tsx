"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileQuestion, FileText, Download, Eye, EyeOff, Trash2, Filter, ListChecks, Plus, Send, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  CASE_DOCUMENT_STATUSES,
  CASE_DOCUMENT_STATUS_LABELS,
  CASE_DOCUMENT_STATUS_COLORS,
  type CaseDocument,
  type CaseDocumentStatus,
  type DocumentCategory,
  type DocumentRequest,
} from "@/lib/types";
import DocumentUpload from "./DocumentUpload";

interface DocumentListProps {
  caseId: string;
  userRole?: string;
  allRoles?: boolean;
}

function formatFileSize(bytes?: number) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType?: string) {
  if (!mimeType) return "📋";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
  return "📎";
}

export default function DocumentList({ caseId, userRole = "admin", allRoles = false }: DocumentListProps) {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [requestDescription, setRequestDescription] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [newRequiredName, setNewRequiredName] = useState("");
  const [newRequiredCategory, setNewRequiredCategory] = useState<string>("otro");
  const [addingRequired, setAddingRequired] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManageChecklist = allRoles || userRole === "comercial_juridico";
  const isExpert = userRole === "perito" || userRole === "perito_interno";
  const canViewDocumentRequests = isExpert || canManageChecklist;

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
      if (canViewDocumentRequests) {
        const requestResponse = await fetch(`/api/cases/${caseId}/document-requests`);
        const requestPayload = await requestResponse.json();
        if (requestPayload.success) setRequests(requestPayload.data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [canViewDocumentRequests, caseId, categoryFilter]);

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

  async function handleStatusChange(docId: string, status: string) {
    try {
      await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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

  // RF-05: crear documento requerido (placeholder sin archivo, estado "No Recibido")
  async function handleAddRequired() {
    if (!newRequiredName.trim()) return;
    setAddingRequired(true);
    try {
      await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newRequiredName.trim(), category: newRequiredCategory }),
      });
      setNewRequiredName("");
      fetchDocuments();
    } catch {
      // Ignore
    } finally {
      setAddingRequired(false);
    }
  }

  function triggerUploadFor(docId: string) {
    setUploadTargetId(docId);
    fileInputRef.current?.click();
  }

  async function handlePlaceholderFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !uploadTargetId) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentId", uploadTargetId);
    try {
      await fetch(`/api/cases/${caseId}/documents`, { method: "POST", body: formData });
      fetchDocuments();
    } catch {
      // Ignore
    } finally {
      setUploadTargetId(null);
    }
  }

  async function handleDocumentRequest(event: React.FormEvent) {
    event.preventDefault();
    if (requestDescription.trim().length < 5) return;
    setRequesting(true);
    setRequestError("");
    try {
      const response = await fetch(`/api/cases/${caseId}/document-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: requestDescription.trim() }),
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "No fue posible enviar la solicitud");
      setRequestDescription("");
      await fetchDocuments();
    } catch (requestSubmitError) {
      setRequestError(requestSubmitError instanceof Error ? requestSubmitError.message : "No fue posible enviar la solicitud");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      {(allRoles || userRole === "comercial_juridico") && <DocumentUpload caseId={caseId} onSuccess={fetchDocuments} />}

      {canViewDocumentRequests && (
        <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-start gap-3">
            <FileQuestion className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div>
              <h3 className="text-sm font-semibold text-blue-950">
                {isExpert ? "Solicitar documentación al Comercial Jurídico" : "Solicitudes de documentación del perito"}
              </h3>
              <p className="text-xs text-blue-800">
                {isExpert
                  ? "La solicitud se envía únicamente al Comercial Jurídico asignado; nunca se contacta al cliente final."
                  : "Solicitudes enviadas por los peritos asignados a este caso."}
              </p>
            </div>
          </div>
          {isExpert && (
            <form onSubmit={handleDocumentRequest} className="space-y-3">
              <Textarea value={requestDescription} onChange={(event) => setRequestDescription(event.target.value)} placeholder="Describe los documentos que necesitas para realizar el dictamen..." rows={3} maxLength={2000} />
              {requestError && <p className="text-sm text-red-700">{requestError}</p>}
              <div className="flex justify-end"><Button type="submit" disabled={requesting || requestDescription.trim().length < 5}><Send className="mr-2 h-4 w-4" />{requesting ? "Enviando..." : "Enviar solicitud"}</Button></div>
            </form>
          )}
          <div className={`space-y-2 ${isExpert ? "border-t border-blue-200 pt-3" : ""}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-900">
              {isExpert ? "Solicitudes realizadas" : "Solicitudes recibidas"}
            </p>
            {requests.length > 0 ? (
              requests.map((request) => (
                <div key={request._id} className="rounded-md bg-white p-3 text-sm">
                  <p>{request.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.requestedBy?.displayName ? `${request.requestedBy.displayName} · ` : ""}
                    {new Date(request._createdAt).toLocaleString("es-CO")} · {request.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-white p-3 text-sm text-muted-foreground">No hay solicitudes de documentación.</p>
            )}
          </div>
        </div>
      )}

      {/* RF-05: checklist — definir documentos requeridos */}
      {canManageChecklist && (
        <div className="rounded-lg border border-dashed p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ListChecks className="h-4 w-4" />
            Checklist documental — agregar documento requerido
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={newRequiredName}
              onChange={(e) => setNewRequiredName(e.target.value)}
              placeholder="Nombre del documento requerido (ej. Poder firmado)"
              className="flex-1"
            />
            <Select value={newRequiredCategory} onValueChange={setNewRequiredCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{DOCUMENT_CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddRequired} disabled={addingRequired || !newRequiredName.trim()}>
              <Plus className="mr-1 h-4 w-4" />
              {addingRequired ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </div>
      )}

      {/* input oculto para subir archivo a un requerido */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handlePlaceholderFile} />

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
          {documents.map((doc) => {
            const status = (doc.status ?? "recibido") as CaseDocumentStatus;
            const statusColor = CASE_DOCUMENT_STATUS_COLORS[status];
            return (
              <div key={doc._id} className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {doc.fileName || doc.description || "Documento requerido"}
                    {doc.isRequired && (
                      <Badge variant="outline" className="ml-2 text-[10px] uppercase tracking-wide">
                        Requerido
                      </Badge>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge className={`text-xs border-0 ${statusColor?.bg} ${statusColor?.text}`}>
                      <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${statusColor?.dot}`} />
                      {CASE_DOCUMENT_STATUS_LABELS[status]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {DOCUMENT_CATEGORY_LABELS[doc.category as DocumentCategory] || doc.category}
                    </Badge>
                    {doc.fileSize != null && (
                      <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {doc.uploadedByName || doc.uploadedBy?.displayName || "Sistema"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc._createdAt).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {canManageChecklist && !doc._id.startsWith("payment-receipt-") && (
                    <Select value={status} onValueChange={(v) => handleStatusChange(doc._id, v)}>
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CASE_DOCUMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{CASE_DOCUMENT_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {!doc.downloadUrl && canManageChecklist && !doc._id.startsWith("payment-receipt-") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerUploadFor(doc._id)}
                      title="Subir archivo de este requerido"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                  {canManageChecklist && !doc._id.startsWith("payment-receipt-") && (
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
                  )}
                  {doc.downloadUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" title="Descargar">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {canManageChecklist && !doc._id.startsWith("payment-receipt-") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc._id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
