"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Send, CheckCircle, XCircle, Pencil, Calendar } from "lucide-react";
import { WORK_PLAN_STATUS_LABELS, WORK_PLAN_STATUS_COLORS, type WorkPlan, type WorkPlanStatus } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

interface WorkPlanTabProps { caseId: string; }

function formatDate(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

export default function WorkPlanTab({ caseId }: WorkPlanTabProps) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<WorkPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectComments, setRejectComments] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [methodology, setMethodology] = useState("");
  const [objectives, setObjectives] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [deliverablesDescription, setDeliverablesDescription] = useState("");

  const canEdit = user && ["admin", "perito", "tecnico"].includes(user.role);
  const canApprove = user && ["admin", "comite", "tecnico"].includes(user.role);

  async function loadPlan() {
    try {
      const res = await fetch(`/api/cases/${caseId}/work-plan`);
      const data = await res.json();
      if (data.success && data.data) setPlan(data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadPlan(); }, [caseId]);

  function populateForm(p?: WorkPlan | null) {
    setMethodology(p?.methodology || "");
    setObjectives(p?.objectives || "");
    setStartDate(p?.startDate ? p.startDate.slice(0, 10) : "");
    setEndDate(p?.endDate ? p.endDate.slice(0, 10) : "");
    setEstimatedDays(p?.estimatedDays ? String(p.estimatedDays) : "");
    setDeliverablesDescription(p?.deliverablesDescription || "");
  }

  async function handleSave() {
    setActionLoading(true); setError("");
    try {
      const payload = { methodology, objectives, startDate: startDate || undefined, endDate: endDate || undefined, estimatedDays: parseInt(estimatedDays) || 0, deliverablesDescription };
      const url = plan ? `/api/work-plans/${plan._id}` : `/api/cases/${caseId}/work-plan`;
      const res = await fetch(url, { method: plan ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { setShowForm(false); setLoading(true); loadPlan(); }
      else setError(data.error);
    } catch { setError("Error de conexion"); }
    finally { setActionLoading(false); }
  }

  async function handleAction(action: string, comments?: string) {
    if (!plan) return;
    setActionLoading(true); setError("");
    try {
      const url = `/api/work-plans/${plan._id}/${action}`;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rejectionComments: comments }) });
      const data = await res.json();
      if (data.success) { setShowRejectDialog(false); setRejectComments(""); setLoading(true); loadPlan(); }
      else setError(data.error);
    } catch { setError("Error de conexion"); }
    finally { setActionLoading(false); }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (showForm) {
    return (
      <div className="space-y-4">
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2"><Label>Metodologia</Label><Textarea value={methodology} onChange={(e) => setMethodology(e.target.value)} rows={4} placeholder="Describe la metodologia..." /></div>
          <div className="space-y-2"><Label>Objetivos</Label><Textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={4} placeholder="Objetivos del plan..." /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2"><Label>Fecha Inicio</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Fecha Fin</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Dias Estimados</Label><Input type="number" min="1" value={estimatedDays} onChange={(e) => setEstimatedDays(e.target.value)} /></div>
        </div>
        <div className="space-y-2"><Label>Descripcion de Entregas</Label><Textarea value={deliverablesDescription} onChange={(e) => setDeliverablesDescription(e.target.value)} rows={3} /></div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={actionLoading}>{actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center py-12">
        <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-3">No hay plan de trabajo</p>
        {canEdit && <Button onClick={() => { populateForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />Crear Plan</Button>}
      </div>
    );
  }

  const statusColor = WORK_PLAN_STATUS_COLORS[plan.status];

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      <div className="flex items-center justify-between">
        <Badge className={`${statusColor?.bg} ${statusColor?.text} border-0`}><span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusColor?.dot}`} />{WORK_PLAN_STATUS_LABELS[plan.status]}</Badge>
        <div className="flex gap-2">
          {(plan.status === "borrador" || plan.status === "rechazado") && canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={() => { populateForm(plan); setShowForm(true); }}><Pencil className="mr-2 h-3.5 w-3.5" />Editar</Button>
              <Button size="sm" onClick={() => handleAction("submit")} disabled={actionLoading}><Send className="mr-2 h-3.5 w-3.5" />Enviar</Button>
            </>
          )}
          {(plan.status === "enviado" || plan.status === "en_revision") && canApprove && (
            <>
              <Button variant="outline" size="sm" className="text-red-600" onClick={() => setShowRejectDialog(true)}><XCircle className="mr-2 h-3.5 w-3.5" />Rechazar</Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction("approve")} disabled={actionLoading}>{actionLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-2 h-3.5 w-3.5" />}Aprobar</Button>
            </>
          )}
        </div>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div><p className="text-xs text-muted-foreground font-medium">Metodologia</p><p className="text-sm mt-1 whitespace-pre-wrap">{plan.methodology || "-"}</p></div>
            <div><p className="text-xs text-muted-foreground font-medium">Objetivos</p><p className="text-sm mt-1 whitespace-pre-wrap">{plan.objectives || "-"}</p></div>
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-xs text-muted-foreground">Fecha Inicio</p><p className="text-sm font-medium">{formatDate(plan.startDate)}</p></div>
            <div><p className="text-xs text-muted-foreground">Fecha Fin</p><p className="text-sm font-medium">{formatDate(plan.endDate)}</p></div>
            <div><p className="text-xs text-muted-foreground">Dias Estimados</p><p className="text-sm font-medium">{plan.estimatedDays || "-"}</p></div>
          </div>
          {plan.deliverablesDescription && (<><Separator /><div><p className="text-xs text-muted-foreground font-medium">Descripcion de Entregas</p><p className="text-sm mt-1 whitespace-pre-wrap">{plan.deliverablesDescription}</p></div></>)}
          {plan.rejectionComments && (<div className="rounded-lg border border-red-200 bg-red-50 p-3"><p className="text-xs font-medium text-red-700">Comentarios de Rechazo</p><p className="text-sm text-red-600 mt-0.5">{plan.rejectionComments}</p></div>)}
        </CardContent>
      </Card>
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rechazar Plan de Trabajo</DialogTitle><DialogDescription>Indique la razon del rechazo.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label>Comentarios *</Label><Textarea value={rejectComments} onChange={(e) => setRejectComments(e.target.value)} rows={4} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button><Button variant="destructive" onClick={() => handleAction("reject", rejectComments)} disabled={!rejectComments.trim() || actionLoading}>Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
