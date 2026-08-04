"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileText, Loader2, Paperclip, Send, XCircle } from "lucide-react";
import { usePusher } from "@/hooks/usePusher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DELIVERABLE_PHASE_LABELS,
  DELIVERABLE_STATUS_COLORS,
  DELIVERABLE_STATUS_LABELS,
  type Deliverable,
  type DeliverablePhase,
  type DeliverableStatus,
} from "@/lib/types";

interface DeliverablesTabProps {
  caseId: string;
  userRole?: string;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "-";
}

function formatSize(value?: number) {
  if (!value) return "";
  return value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function DeliverablesTab({ caseId, userRole = "admin" }: DeliverablesTabProps) {
  const [items, setItems] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dictamen, setDictamen] = useState<File | null>(null);
  const [annexes, setAnnexes] = useState<File[]>([]);
  const [comments, setComments] = useState("");
  const [reviewTarget, setReviewTarget] = useState<Deliverable | null>(null);
  const [reviewAction, setReviewAction] = useState<"aprobado" | "rechazado">("aprobado");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const dictamenRef = useRef<HTMLInputElement>(null);
  const annexesRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/cases/${caseId}/deliverables`);
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "No fue posible cargar las entregas");
      setItems(payload.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las entregas");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { load(); }, [load]);
  usePusher(["deliverable:created", "deliverable:reviewed"], () => { load(); });

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!dictamen) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("phase", "dictamen_final");
      form.set("dictamen", dictamen);
      form.set("comments", comments.trim());
      annexes.forEach((file) => form.append("anexos", file));
      const response = await fetch(`/api/cases/${caseId}/deliverables`, { method: "POST", body: form });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "No fue posible enviar el dictamen");
      setDictamen(null);
      setAnnexes([]);
      setComments("");
      if (dictamenRef.current) dictamenRef.current.value = "";
      if (annexesRef.current) annexesRef.current.value = "";
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No fue posible enviar el dictamen");
    } finally {
      setUploading(false);
    }
  }

  async function review() {
    if (!reviewTarget) return;
    if (reviewAction === "rechazado" && rejectionReason.trim().length < 5) {
      setError("El comentario de devolución debe tener al menos 5 caracteres.");
      return;
    }
    setReviewing(true);
    setError("");
    try {
      const response = await fetch(`/api/deliverables/${reviewTarget._id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: reviewAction, rejectionReason: rejectionReason.trim() }),
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "No fue posible revisar la entrega");
      setReviewTarget(null);
      setRejectionReason("");
      await load();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "No fue posible revisar la entrega");
    } finally {
      setReviewing(false);
    }
  }

  const canUpload = userRole === "perito" || userRole === "admin";
  const canReview = userRole === "admin" || userRole === "juridico";

  return (
    <div className="space-y-5">
      {canUpload && (
        <form onSubmit={upload} className="space-y-4 rounded-lg border bg-white p-4">
          <div>
            <h3 className="font-semibold">Enviar dictamen y anexos</h3>
            <p className="text-sm text-muted-foreground">El dictamen principal debe ser PDF. Puedes adjuntar hasta 10 anexos.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`dictamen-${caseId}`}>PDF del dictamen *</Label>
              <Input
                ref={dictamenRef}
                id={`dictamen-${caseId}`}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setDictamen(event.target.files?.[0] || null)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`anexos-${caseId}`}>Anexos (opcionales)</Label>
              <Input
                ref={annexesRef}
                id={`anexos-${caseId}`}
                type="file"
                multiple
                onChange={(event) => setAnnexes(Array.from(event.target.files || []).slice(0, 10))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`deliverable-comments-${caseId}`}>Observaciones</Label>
            <Textarea id={`deliverable-comments-${caseId}`} value={comments} onChange={(event) => setComments(event.target.value)} rows={3} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!dictamen || uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar para revisión
            </Button>
          </div>
        </form>
      )}

      {userRole === "cliente" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Aquí solo aparecen los dictámenes que ya fueron verificados y aprobados por el área jurídica.
        </div>
      )}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-muted-foreground"><FileText className="mb-3 h-8 w-8" /><p className="text-sm">No hay dictámenes disponibles.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const colors = DELIVERABLE_STATUS_COLORS[item.status as DeliverableStatus];
            return (
              <Card key={item._id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{DELIVERABLE_PHASE_LABELS[item.phase as DeliverablePhase]}</Badge>
                        <Badge className={`${colors?.bg} ${colors?.text} border-0`}>{DELIVERABLE_STATUS_LABELS[item.status as DeliverableStatus]}</Badge>
                        <span className="text-xs text-muted-foreground">Versión {item.version}</span>
                      </div>
                      <p className="truncate text-sm font-medium">{item.fileName || "Dictamen"}</p>
                      <p className="text-xs text-muted-foreground">Enviado {formatDate(item._createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.downloadUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />Dictamen</a>
                        </Button>
                      )}
                      {canReview && ["enviado", "en_revision"].includes(item.status) && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-700" onClick={() => { setReviewAction("aprobado"); setReviewTarget(item); }}><CheckCircle2 className="mr-2 h-4 w-4" />Aprobar</Button>
                          <Button size="sm" variant="outline" className="text-red-700" onClick={() => { setReviewAction("rechazado"); setReviewTarget(item); }}><XCircle className="mr-2 h-4 w-4" />Devolver</Button>
                        </>
                      )}
                    </div>
                  </div>
                  {item.comments && <p className="text-sm text-muted-foreground">{item.comments}</p>}
                  {item.rejectionReason && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700"><strong>Comentario de devolución:</strong> {item.rejectionReason}</div>}
                  {(item.attachments?.length || 0) > 0 && (
                    <div className="border-t pt-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Anexos</p>
                      <div className="flex flex-wrap gap-2">
                        {item.attachments?.map((attachment) => (
                          <Button key={attachment._id} variant="outline" size="sm" asChild>
                            <a href={attachment.downloadUrl} target="_blank" rel="noopener noreferrer"><Paperclip className="mr-2 h-3.5 w-3.5" />{attachment.fileName}{attachment.fileSize ? ` · ${formatSize(attachment.fileSize)}` : ""}</a>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => { if (!open) { setReviewTarget(null); setRejectionReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === "aprobado" ? "Aprobar dictamen" : "Devolver dictamen"}</DialogTitle>
            <DialogDescription>
              {reviewAction === "aprobado"
                ? "Al aprobarlo, el cliente final podrá verlo y descargarlo inmediatamente."
                : "El comentario es obligatorio y llegará al perito por el hilo del caso."}
            </DialogDescription>
          </DialogHeader>
          {reviewAction === "rechazado" && (
            <div className="space-y-2"><Label htmlFor="deliverable-rejection">Comentario de devolución *</Label><Textarea id="deliverable-rejection" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={4} minLength={5} /></div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)}>Cancelar</Button>
            <Button onClick={review} disabled={reviewing || (reviewAction === "rechazado" && rejectionReason.trim().length < 5)} className={reviewAction === "rechazado" ? "bg-red-600 hover:bg-red-700" : ""}>
              {reviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reviewAction === "aprobado" ? "Aprobar y liberar" : "Devolver al perito"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
