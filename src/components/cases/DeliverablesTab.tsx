"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, CheckCircle, XCircle, FileText, Download } from "lucide-react";
import {
  DELIVERABLE_PHASE_LABELS, DELIVERABLE_STATUS_LABELS, DELIVERABLE_STATUS_COLORS,
  type Deliverable, type DeliverablePhase, type DeliverableStatus,
} from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

interface DeliverablesTabProps { caseId: string; }

export default function DeliverablesTab({ caseId }: DeliverablesTabProps) {
  const { user } = useAuth();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState<Deliverable | null>(null);
  const [phase, setPhase] = useState("");
  const [fileName, setFileName] = useState("");
  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = user && ["admin", "perito"].includes(user.role);
  const canReview = user && ["admin", "tecnico", "comite"].includes(user.role);

  async function load() {
    try {
      const res = await fetch(`/api/cases/${caseId}/deliverables`);
      const data = await res.json();
      if (data.success) setDeliverables(data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [caseId]);

  const approvedPhases = {
    marco_conceptual: deliverables.some(d => d.phase === "marco_conceptual" && d.status === "aprobado"),
    desarrollo_tecnico: deliverables.some(d => d.phase === "desarrollo_tecnico" && d.status === "aprobado"),
    dictamen_final: deliverables.some(d => d.phase === "dictamen_final" && d.status === "aprobado"),
  };
  const progressPercent = Object.values(approvedPhases).filter(Boolean).length * 33.33;

  async function handleCreate() {
    if (!phase) return;
    setActionLoading(true); setError("");
    try {
      const res = await fetch(`/api/cases/${caseId}/deliverables`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase, fileName, comments }) });
      const data = await res.json();
      if (data.success) { setShowCreateDialog(false); setPhase(""); setFileName(""); setComments(""); setLoading(true); load(); }
      else setError(data.error);
    } catch { setError("Error de conexion"); }
    finally { setActionLoading(false); }
  }

  async function handleReview(action: "aprobado" | "rechazado") {
    if (!showReviewDialog) return;
    if (action === "rechazado" && !rejectionReason.trim()) { setError("Razon requerida"); return; }
    setActionLoading(true); setError("");
    try {
      const res = await fetch(`/api/deliverables/${showReviewDialog._id}/review`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, rejectionReason }) });
      const data = await res.json();
      if (data.success) { setShowReviewDialog(null); setRejectionReason(""); setLoading(true); load(); }
      else setError(data.error);
    } catch { setError("Error de conexion"); }
    finally { setActionLoading(false); }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso de Entregas</span>
            <span className="text-sm text-muted-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex justify-between mt-2 text-xs">
            {(["marco_conceptual", "desarrollo_tecnico", "dictamen_final"] as const).map((p) => (
              <span key={p} className={approvedPhases[p] ? "text-green-600 font-medium" : "text-muted-foreground"}>
                {approvedPhases[p] ? "✓ " : ""}{DELIVERABLE_PHASE_LABELS[p]}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{deliverables.length} entrega{deliverables.length !== 1 ? "s" : ""}</p>
        {canSubmit && <Button size="sm" onClick={() => setShowCreateDialog(true)}><Plus className="mr-2 h-4 w-4" />Nueva Entrega</Button>}
      </div>

      {deliverables.length === 0 ? (
        <div className="flex flex-col items-center py-12"><FileText className="h-8 w-8 text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No hay entregas</p></div>
      ) : (
        <div className="space-y-3">
          {deliverables.map((d) => {
            const sc = DELIVERABLE_STATUS_COLORS[d.status];
            return (
              <Card key={d._id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{DELIVERABLE_PHASE_LABELS[d.phase]}</Badge>
                      <Badge className={`${sc?.bg} ${sc?.text} border-0`}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${sc?.dot}`} />{DELIVERABLE_STATUS_LABELS[d.status]}</Badge>
                      <span className="text-xs text-muted-foreground">v{d.version}</span>
                    </div>
                    {d.fileName && <p className="text-sm">{d.fileName}</p>}
                    {d.comments && <p className="text-xs text-muted-foreground">{d.comments}</p>}
                    {d.rejectionReason && <p className="text-xs text-red-600">Rechazo: {d.rejectionReason}</p>}
                    <p className="text-xs text-muted-foreground">Por: {d.submittedBy?.displayName || "Sistema"}</p>
                  </div>
                  <div className="flex gap-2">
                    {d.fileUrl && <Button variant="outline" size="sm" asChild><a href={d.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-3.5 w-3.5" /></a></Button>}
                    {canReview && (d.status === "enviado" || d.status === "en_revision") && (
                      <>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => { setShowReviewDialog(d); setRejectionReason(""); }}><XCircle className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setShowReviewDialog(d); setTimeout(() => handleReview("aprobado"), 0); }}><CheckCircle className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Entrega</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Fase *</Label>
              <Select value={phase} onValueChange={setPhase}><SelectTrigger><SelectValue placeholder="Seleccionar fase..." /></SelectTrigger><SelectContent>
                <SelectItem value="marco_conceptual">Marco Conceptual</SelectItem>
                <SelectItem value="desarrollo_tecnico">Desarrollo Tecnico</SelectItem>
                <SelectItem value="dictamen_final">Dictamen Final</SelectItem>
              </SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Nombre del Archivo</Label><Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="documento.pdf" /></div>
            <div className="space-y-2"><Label>Comentarios</Label><Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={!phase || actionLoading}>{actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!showReviewDialog} onOpenChange={(o) => !o && setShowReviewDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rechazar Entrega</DialogTitle><DialogDescription>Fase: {showReviewDialog ? DELIVERABLE_PHASE_LABELS[showReviewDialog.phase] : ""}</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label>Razon de rechazo *</Label><Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={4} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setShowReviewDialog(null)}>Cancelar</Button><Button variant="destructive" onClick={() => handleReview("rechazado")} disabled={!rejectionReason.trim() || actionLoading}>Rechazar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
