"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, FileText, Pencil, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CASE_EVENT_LABELS,
  type AuditLog,
  type CaseDocument,
  type CaseEvent,
  type CaseEventType,
} from "@/lib/types";

interface CaseTimelineTabProps {
  caseId: string;
  events: CaseEvent[];
  onReload: () => Promise<void> | void;
  canAddNote: boolean;
  canEdit: boolean;
  /** Personal interno: muestra la trazabilidad (usuario + fecha + acción). */
  canViewAudit: boolean;
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("es-CO", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Un registro cuenta como editado cuando `updated_at` se separa de `created_at`. */
function wasEventEdited(event: CaseEvent) {
  if (!event._updatedAt) return false;
  return new Date(event._updatedAt).getTime() - new Date(event._createdAt).getTime() > 1000;
}

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const ACTION_LABELS: Record<string, string> = {
  "create:case_document": "Documento cargado",
  "update:case_document": "Documento actualizado",
  "delete:case_document": "Documento eliminado",
  "create:case_event": "Actuación registrada",
  "update:case_event": "Actuación modificada",
  "create:client_document_upload_link": "Enlace de carga generado",
  "delete:client_document_upload_link": "Enlace de carga revocado",
  "update:case": "Expediente actualizado",
  "create:case": "Caso creado",
  "delete:case": "Caso eliminado",
};

const FIELD_LABELS: Record<string, string> = {
  reviewStatus: "Revisión", reviewNote: "Observación", status: "Estado", category: "Categoría",
  description: "Descripción", isVisibleToClient: "Visible al cliente", isRequired: "Requerido",
  fileName: "Archivo", version: "Versión", title: "Título", eventDate: "Fecha", documentId: "Documento",
  origen: "Origen", actor: "Quién", requerido: "Documento requerido", expiresAt: "Vence",
  enviadoAlCliente: "Enviado al cliente", commercialStatus: "Etapa comercial",
};

const VALUE_LABELS: Record<string, string> = {
  pendiente_revision: "Pendiente de revisión", aprobado: "Aprobado", requiere_correccion: "Requiere corrección",
  true: "Sí", false: "No", no_recibido: "No recibido", parcial: "Parcial", recibido: "Recibido",
};

function parseValues(raw?: string): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return VALUE_LABELS[text] ?? text;
}

export default function CaseTimelineTab({ caseId, events, onReload, canAddNote, canEdit, canViewAudit }: CaseTimelineTabProps) {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteDate, setNoteDate] = useState("");
  const [noteVisible, setNoteVisible] = useState(false);
  const [noteDocumentId, setNoteDocumentId] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");

  const [editingEvent, setEditingEvent] = useState<CaseEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editVisible, setEditVisible] = useState(false);
  const [editDocumentId, setEditDocumentId] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [auditRows, setAuditRows] = useState<AuditLog[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!canAddNote && !canEdit) return;
    try {
      const res = await fetch(`/api/cases/${caseId}/documents`);
      const data = await res.json();
      if (data.success) {
        setDocuments((data.data as CaseDocument[]).filter((doc) => doc.fileName && !doc._id.startsWith("payment-receipt-")));
      }
    } catch { /* ignore */ }
  }, [caseId, canAddNote, canEdit]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/audit`);
      const data = await res.json();
      if (data.success) setAuditRows(data.data || []);
    } catch { /* ignore */ } finally {
      setAuditLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (auditOpen) loadAudit();
  }, [auditOpen, loadAudit, events]);

  async function handleAddNote() {
    if (!noteText.trim() && !noteTitle.trim()) return;
    setNoteSaving(true);
    setNoteError("");
    try {
      const res = await fetch(`/api/cases/${caseId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "comment",
          title: noteTitle.trim() || undefined,
          description: noteText.trim(),
          eventDate: noteDate ? new Date(noteDate).toISOString() : undefined,
          isVisibleToClient: noteVisible,
          documentId: noteDocumentId || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error agregando la actuación");
      setNoteTitle("");
      setNoteText("");
      setNoteDate("");
      setNoteVisible(false);
      setNoteDocumentId("");
      await onReload();
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setNoteSaving(false);
    }
  }

  function openEditEvent(event: CaseEvent) {
    setEditingEvent(event);
    setEditTitle(event.title || "");
    setEditText(event.description || "");
    setEditDate(toDateTimeLocal(event.eventDate || event._createdAt));
    setEditVisible(Boolean(event.isVisibleToClient));
    setEditDocumentId(event.document?._id || "");
    setEditError("");
  }

  function closeEditEvent() {
    if (editSaving) return;
    setEditingEvent(null);
  }

  async function handleSaveEventEdit() {
    if (!editingEvent || !editText.trim()) return;
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/cases/${caseId}/events/${editingEvent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editText.trim(),
          eventDate: editDate ? new Date(editDate).toISOString() : undefined,
          isVisibleToClient: editVisible,
          documentId: editDocumentId || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error editando el registro");
      setEditingEvent(null);
      await onReload();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setEditSaving(false);
    }
  }

  async function toggleVisibility(event: CaseEvent) {
    setTogglingId(event._id);
    try {
      await fetch(`/api/cases/${caseId}/events/${event._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisibleToClient: !event.isVisibleToClient }),
      });
      await onReload();
    } finally {
      setTogglingId(null);
    }
  }

  const documentOptions = documents.map((doc) => ({
    id: doc._id,
    label: `${doc.fileName || doc.description || "Documento"}${doc.version > 1 ? ` (v${doc.version})` : ""}${doc.isVisibleToClient ? "" : " · oculto al cliente"}`,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Línea de tiempo del caso</CardTitle>
        </CardHeader>
        <CardContent>
          {canAddNote && (
            <>
              <div className="mb-6 space-y-3 rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">Registrar actuación</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="note-title">Título</Label>
                    <Input id="note-title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Ej. Radicación del dictamen ante el juzgado" maxLength={200} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="note-date">Fecha de la actuación</Label>
                    <Input id="note-date" type="datetime-local" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="note-text">Descripción</Label>
                  <Textarea
                    id="note-text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Describe la actuación con un lenguaje comprensible para el cliente si va a ser visible..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Documento de soporte (opcional)</Label>
                    <Select value={noteDocumentId || "none"} onValueChange={(value) => setNoteDocumentId(value === "none" ? "" : value)}>
                      <SelectTrigger><SelectValue placeholder="Sin documento" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin documento</SelectItem>
                        {documentOptions.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>{doc.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm">
                    <Checkbox checked={noteVisible} onCheckedChange={(value) => setNoteVisible(value === true)} />
                    Visible para el cliente (le avisa por correo y en su portal)
                  </label>
                </div>
                {noteError && <p className="text-sm text-destructive">{noteError}</p>}
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleAddNote} disabled={noteSaving || (!noteText.trim() && !noteTitle.trim())}>
                    {noteSaving ? "Guardando..." : "Registrar actuación"}
                  </Button>
                </div>
              </div>
              <Separator className="mb-6" />
            </>
          )}

          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay eventos registrados</p>
          ) : (
            <div className="relative space-y-0">
              {events.map((event, index) => (
                <div key={event._id} className="flex gap-4 pb-6 last:pb-0">
                  <div className="relative flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-full ring-4 ring-background ${event.isVisibleToClient ? "bg-primary" : "bg-muted-foreground/50"}`} />
                    {index < events.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="-mt-0.5 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">
                          {event.title || CASE_EVENT_LABELS[event.eventType as CaseEventType] || event.eventType}
                        </p>
                        {event.title && (
                          <Badge variant="outline" className="text-[10px]">
                            {CASE_EVENT_LABELS[event.eventType as CaseEventType] || event.eventType}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${event.isVisibleToClient ? "border-green-200 bg-green-50 text-green-700" : "text-muted-foreground"}`}
                        >
                          {event.isVisibleToClient ? "Visible al cliente" : "Interno"}
                        </Badge>
                      </div>
                      {canEdit && (
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground"
                            onClick={() => toggleVisibility(event)}
                            disabled={togglingId === event._id}
                            aria-label={event.isVisibleToClient ? "Ocultar al cliente" : "Mostrar al cliente"}
                            title={event.isVisibleToClient ? "Ocultar al cliente" : "Mostrar al cliente"}
                          >
                            {event.isVisibleToClient ? <Eye className="text-green-600" /> : <EyeOff />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground"
                            onClick={() => openEditEvent(event)}
                            aria-label="Editar actuación"
                            title="Editar actuación"
                          >
                            <Pencil />
                          </Button>
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{event.description}</p>
                    )}
                    {event.document && (
                      <a
                        href={`/api/documents/${event.document._id}/download?inline=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {event.document.fileName || event.document.description || "Documento de soporte"}
                      </a>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.createdBy?.displayName || event.createdByName || "Sistema"} &middot;{" "}
                      {formatDateTime(event.eventDate || event._createdAt)}
                      {wasEventEdited(event) && (
                        <span title={`Editado ${formatDateTime(event._updatedAt)}`}> &middot; editado</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canViewAudit && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" /> Trazabilidad del expediente
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setAuditOpen((open) => !open)}>
              {auditOpen ? "Ocultar" : "Ver registro"}
            </Button>
          </CardHeader>
          {auditOpen && (
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Usuario, fecha/hora y acción de cada cambio relevante: documentos cargados, aprobados, devueltos o eliminados; cambios de estado; actuaciones y actualizaciones del expediente.
              </p>
              {auditLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : auditRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin registros de trazabilidad todavía.</p>
              ) : (
                <div className="divide-y rounded-md border">
                  {auditRows.map((row) => {
                    const before = parseValues(row.oldValues);
                    const after = parseValues(row.newValues);
                    const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
                    return (
                      <div key={row._id} className="px-3 py-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{ACTION_LABELS[row.action] || row.action}</span>
                          <span className="text-muted-foreground">
                            {row.user?.displayName || (after?.actor as string) || "Sistema"} · {formatDateTime(row._createdAt)}
                          </span>
                        </div>
                        {keys.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {keys.filter((key) => key !== "actor").map((key) => (
                              <div key={key} className="flex flex-wrap items-baseline gap-1">
                                <span className="font-medium text-muted-foreground">{FIELD_LABELS[key] || key}:</span>
                                {before && key in before && (
                                  <span className="text-red-600 line-through">{renderValue(before[key])}</span>
                                )}
                                {before && after && key in before && key in after && <span aria-hidden>→</span>}
                                {after && key in after && <span className="text-green-700">{renderValue(after[key])}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      <Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open) closeEditEvent(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar actuación
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? `${CASE_EVENT_LABELS[editingEvent.eventType as CaseEventType] || editingEvent.eventType} · registrada ${formatDateTime(editingEvent._createdAt)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={200} placeholder="Título comprensible para el cliente" />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Corrija o complemente la información del registro..."
                rows={4}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Fecha de la actuación</Label>
                <Input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Documento de soporte</Label>
                <Select value={editDocumentId || "none"} onValueChange={(value) => setEditDocumentId(value === "none" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Sin documento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin documento</SelectItem>
                    {documentOptions.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={editVisible} onCheckedChange={(value) => setEditVisible(value === true)} />
              Visible para el cliente
            </label>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditEvent} disabled={editSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEventEdit} disabled={editSaving || !editText.trim()}>
              {editSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
