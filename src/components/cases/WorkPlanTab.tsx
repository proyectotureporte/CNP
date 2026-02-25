"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, Plus, CheckCircle, XCircle, Pencil, Calendar,
  Trash2, Upload, FileText, Clock, User, PlayCircle, AlertTriangle,
  MessageSquare, MoreVertical, RefreshCw,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS, ROLE_LABELS,
  OBSERVATION_TYPES, OBSERVATION_TYPE_LABELS,
  type WorkPlanActivity, type ActivityStatus, type UserRole, type ObservationType,
} from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

interface WorkPlanTabProps { caseId: string; userRole?: string; }

interface ActivityCounts {
  total: number;
  completadas: number;
  en_progreso: number;
  pendientes: number;
}

interface SystemUser {
  _id: string;
  displayName: string;
  role: UserRole;
}

type DeadlineLevel = "vencida" | "urgente" | "proximo" | "en_tiempo" | null;
type FilterType = "todas" | "urgente" | "proximo";

function formatDate(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function getDeadlineLevel(dueDate?: string, status?: string): DeadlineLevel {
  if (!dueDate || status === "completada") return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "vencida";
  if (diffDays < 7) return "urgente";
  if (diffDays <= 15) return "proximo";
  return "en_tiempo";
}

const DEADLINE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: boolean }> = {
  vencida: { label: "Vencida", bg: "bg-red-100", text: "text-red-700", icon: true },
  urgente: { label: "Urgente", bg: "bg-red-100", text: "text-red-700", icon: true },
  proximo: { label: "Proximo a Vencer", bg: "bg-amber-100", text: "text-amber-700", icon: true },
  en_tiempo: { label: "En Tiempo", bg: "bg-green-100", text: "text-green-700", icon: false },
};

export default function WorkPlanTab({ caseId, userRole }: WorkPlanTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activities, setActivities] = useState<WorkPlanActivity[]>([]);
  const [counts, setCounts] = useState<ActivityCounts>({ total: 0, completadas: 0, en_progreso: 0, pendientes: 0 });

  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<WorkPlanActivity | null>(null);
  const [saving, setSaving] = useState(false);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadActivityId, setUploadActivityId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [actTitle, setActTitle] = useState("");
  const [actDescription, setActDescription] = useState("");
  const [actDueDate, setActDueDate] = useState("");
  const [actAssignedTo, setActAssignedTo] = useState("");

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [filter, setFilter] = useState<FilterType>("todas");

  // Observation dialog state (administrativo)
  const [showObsDialog, setShowObsDialog] = useState(false);
  const [obsActivityId, setObsActivityId] = useState("");
  const [obsType, setObsType] = useState<ObservationType>("observacion");
  const [obsComment, setObsComment] = useState("");
  const [obsSaving, setObsSaving] = useState(false);

  // Recalculate dates dialog state
  const [showRecalcDialog, setShowRecalcDialog] = useState(false);
  const [newEndDate, setNewEndDate] = useState("");
  const [recalcSaving, setRecalcSaving] = useState(false);

  const role = userRole || user?.role || '';
  const canEdit = user && ["admin"].includes(role);
  const isAdministrativo = role === "administrativo";

  const progressPercent = counts.total > 0
    ? Math.round((counts.completadas / counts.total) * 100)
    : 0;

  // Filtrar actividades
  const filteredActivities = useMemo(() => {
    if (filter === "todas") return activities;
    return activities.filter((act) => {
      const level = getDeadlineLevel(act.dueDate, act.status);
      if (filter === "urgente") return level === "urgente" || level === "vencida";
      if (filter === "proximo") return level === "proximo";
      return true;
    });
  }, [activities, filter]);

  // Contadores de filtros
  const urgentCount = useMemo(() =>
    activities.filter((a) => { const l = getDeadlineLevel(a.dueDate, a.status); return l === "urgente" || l === "vencida"; }).length
  , [activities]);
  const proximoCount = useMemo(() =>
    activities.filter((a) => getDeadlineLevel(a.dueDate, a.status) === "proximo").length
  , [activities]);

  const loadActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/activities`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.data.activities || []);
        setCounts(data.data.counts || { total: 0, completadas: 0, en_progreso: 0, pendientes: 0 });
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [caseId]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success) setSystemUsers(data.data || []);
      } catch { /* ignore */ }
    }
    loadUsers();
  }, []);

  function openCreateDialog() {
    setEditingActivity(null);
    setActTitle("");
    setActDescription("");
    setActDueDate("");
    setActAssignedTo("");
    setShowDialog(true);
  }

  function openEditDialog(act: WorkPlanActivity) {
    setEditingActivity(act);
    setActTitle(act.title);
    setActDescription(act.description || "");
    setActDueDate(act.dueDate ? act.dueDate.slice(0, 10) : "");
    setActAssignedTo(act.assignedTo?._id || "");
    setShowDialog(true);
  }

  async function handleSaveActivity() {
    setSaving(true);
    setError("");
    try {
      if (editingActivity) {
        const res = await fetch(`/api/activities/${editingActivity._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: actTitle,
            description: actDescription,
            dueDate: actDueDate || null,
            assignedTo: actAssignedTo && actAssignedTo !== "none" ? actAssignedTo : null,
          }),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
      } else {
        const res = await fetch(`/api/cases/${caseId}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: actTitle,
            description: actDescription,
            dueDate: actDueDate || undefined,
            assignedTo: actAssignedTo && actAssignedTo !== "none" ? actAssignedTo : undefined,
          }),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
      }
      setShowDialog(false);
      loadActivities();
    } catch { setError("Error de conexion"); }
    finally { setSaving(false); }
  }

  async function handleChangeStatus(activityId: string, newStatus: ActivityStatus) {
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) loadActivities();
      else setError(data.error);
    } catch { setError("Error de conexion"); }
  }

  async function handleDeleteActivity(activityId: string) {
    if (!confirm("Eliminar esta actividad?")) return;
    try {
      const res = await fetch(`/api/activities/${activityId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) loadActivities();
      else setError(data.error);
    } catch { setError("Error de conexion"); }
  }

  async function handleUploadFile() {
    if (!uploadFile || !uploadActivityId) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch(`/api/activities/${uploadActivityId}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setShowUploadDialog(false);
        setUploadFile(null);
        setUploadActivityId("");
        loadActivities();
      } else setError(data.error);
    } catch { setError("Error subiendo archivo"); }
    finally { setUploadLoading(false); }
  }

  function openObsDialog(activityId: string, type: ObservationType) {
    setObsActivityId(activityId);
    setObsType(type);
    setObsComment("");
    setShowObsDialog(true);
  }

  async function handleSaveObservation() {
    if (!obsComment.trim() || !obsActivityId) return;
    setObsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${caseId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[${OBSERVATION_TYPE_LABELS[obsType]}] ${obsComment.slice(0, 60)}`,
          description: obsComment,
          isObservation: true,
          observationType: obsType,
          parentActivityId: obsActivityId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowObsDialog(false);
        loadActivities();
      } else setError(data.error || "Error al guardar observacion");
    } catch { setError("Error de conexion"); }
    finally { setObsSaving(false); }
  }

  async function handleRecalculateDates() {
    if (!newEndDate) return;
    setRecalcSaving(true);
    setError("");
    try {
      // Get earliest and latest dates from activities
      const dated = activities.filter((a) => a.dueDate);
      if (dated.length === 0) { setError("No hay actividades con fecha para recalcular"); setRecalcSaving(false); return; }

      const sortedByDate = [...dated].sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
      const firstDate = new Date(sortedByDate[0].dueDate!);
      const lastDate = new Date(sortedByDate[sortedByDate.length - 1].dueDate!);
      const originalSpan = lastDate.getTime() - firstDate.getTime();
      if (originalSpan <= 0) { setError("Las actividades tienen la misma fecha"); setRecalcSaving(false); return; }

      const newEnd = new Date(newEndDate);
      const newSpan = newEnd.getTime() - firstDate.getTime();
      const ratio = newSpan / originalSpan;

      // Update each dated activity proportionally
      for (const act of dated) {
        const origDate = new Date(act.dueDate!);
        const offset = origDate.getTime() - firstDate.getTime();
        const newDate = new Date(firstDate.getTime() + offset * ratio);
        await fetch(`/api/activities/${act._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueDate: newDate.toISOString().slice(0, 10) }),
        });
      }
      setShowRecalcDialog(false);
      loadActivities();
    } catch { setError("Error recalculando fechas"); }
    finally { setRecalcSaving(false); }
  }

  // Agrupar usuarios por rol
  const usersByRole = useMemo(() => {
    return systemUsers.reduce<Record<string, SystemUser[]>>((acc, u) => {
      if (!acc[u.role]) acc[u.role] = [];
      acc[u.role].push(u);
      return acc;
    }, {});
  }, [systemUsers]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-5">
      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* Barra de progreso */}
      {counts.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso del caso</span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-gray-400" />{counts.pendientes} pendientes</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" />{counts.en_progreso} en progreso</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" />{counts.completadas} completadas</span>
          </div>
        </div>
      )}

      {/* Header + filtros + boton agregar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold">Actividades ({counts.total})</h3>
          {counts.total > 0 && (
            <div className="flex gap-1">
              <Button
                variant={filter === "todas" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setFilter("todas")}
              >
                Todas
              </Button>
              <Button
                variant={filter === "proximo" ? "default" : "outline"}
                size="sm"
                className={`h-7 text-xs px-2 ${filter !== "proximo" ? "border-amber-300 text-amber-700 hover:bg-amber-50" : "bg-amber-500 hover:bg-amber-600"}`}
                onClick={() => setFilter(filter === "proximo" ? "todas" : "proximo")}
              >
                Proximo a Vencer ({proximoCount})
              </Button>
              <Button
                variant={filter === "urgente" ? "default" : "outline"}
                size="sm"
                className={`h-7 text-xs px-2 ${filter !== "urgente" ? "border-red-300 text-red-700 hover:bg-red-50" : "bg-red-500 hover:bg-red-600"}`}
                onClick={() => setFilter(filter === "urgente" ? "todas" : "urgente")}
              >
                Urgente ({urgentCount})
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdministrativo && activities.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { setNewEndDate(""); setShowRecalcDialog(true); }}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />Recalcular Fechas
            </Button>
          )}
          {canEdit && (
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-2 h-3.5 w-3.5" />Agregar Actividad
            </Button>
          )}
        </div>
      </div>

      {/* Lista de actividades */}
      {activities.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-muted-foreground">
          <Clock className="h-8 w-8 mb-3" />
          <p className="text-sm">No hay actividades registradas</p>
          {canEdit && <p className="text-xs mt-1">Usa el boton &quot;Agregar Actividad&quot; para comenzar</p>}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <p className="text-sm">No hay actividades con este filtro</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((act) => {
            const sc = ACTIVITY_STATUS_COLORS[act.status];
            const deadlineLevel = getDeadlineLevel(act.dueDate, act.status);
            const dlConfig = deadlineLevel ? DEADLINE_CONFIG[deadlineLevel] : null;

            return (
              <Card key={act._id} className={deadlineLevel === "urgente" || deadlineLevel === "vencida" ? "border-red-300" : deadlineLevel === "proximo" ? "border-amber-300" : ""}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{act.title}</p>
                        <Badge className={`${sc?.bg} ${sc?.text} border-0 text-[11px] px-1.5 py-0`}>
                          <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${sc?.dot}`} />
                          {ACTIVITY_STATUS_LABELS[act.status]}
                        </Badge>
                        {dlConfig && (
                          <Badge className={`${dlConfig.bg} ${dlConfig.text} border-0 text-[11px] px-1.5 py-0`}>
                            {dlConfig.icon && <AlertTriangle className="mr-1 h-3 w-3" />}
                            {dlConfig.label}
                          </Badge>
                        )}
                      </div>

                      {act.description && <p className="text-xs text-muted-foreground line-clamp-2">{act.description}</p>}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {act.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="font-medium text-foreground">{act.assignedTo.displayName}</span>
                            <span className="opacity-60">({ROLE_LABELS[act.assignedTo.role as UserRole] || act.assignedTo.role})</span>
                          </span>
                        )}
                        {act.dueDate && (
                          <span className={`flex items-center gap-1 ${deadlineLevel === "urgente" || deadlineLevel === "vencida" ? "text-red-600 font-medium" : deadlineLevel === "proximo" ? "text-amber-600 font-medium" : ""}`}>
                            <Calendar className="h-3 w-3" />
                            <span>Fecha limite:</span> {formatDate(act.dueDate)}
                          </span>
                        )}
                        {act.startedAt && (
                          <span className="flex items-center gap-1">
                            <PlayCircle className="h-3 w-3 text-blue-500" />
                            <span>Inicio:</span> {formatDate(act.startedAt)}
                          </span>
                        )}
                        {act.completedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Completada:</span> {formatDate(act.completedAt)}
                          </span>
                        )}
                        {act.fileUrl && (
                          <a href={act.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <FileText className="h-3 w-3" />{act.fileName || "Archivo"}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        {act.status === "pendiente" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Iniciar" onClick={() => handleChangeStatus(act._id, "en_progreso")}>
                            <PlayCircle className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                        )}
                        {act.status === "en_progreso" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Marcar completada" onClick={() => handleChangeStatus(act._id, "completada")}>
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                        )}
                        {act.status === "completada" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Reabrir" onClick={() => handleChangeStatus(act._id, "pendiente")}>
                            <XCircle className="h-3.5 w-3.5 text-amber-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Subir documento" onClick={() => { setUploadActivityId(act._id); setUploadFile(null); setShowUploadDialog(true); }}>
                          <Upload className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEditDialog(act)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Eliminar" onClick={() => handleDeleteActivity(act._id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    )}

                    {/* Acciones Administrativo - solo lectura + dropdown de observaciones */}
                    {isAdministrativo && (
                      <div className="flex items-center gap-1 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Acciones">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {OBSERVATION_TYPES.map((type) => (
                              <DropdownMenuItem key={type} onClick={() => openObsDialog(act._id, type)}>
                                <MessageSquare className="mr-2 h-3.5 w-3.5" />
                                {OBSERVATION_TYPE_LABELS[type]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog crear/editar actividad */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Editar Actividad" : "Nueva Actividad"}</DialogTitle>
            <DialogDescription>{editingActivity ? "Modifique los datos de la actividad." : "Agregue una actividad al plan de trabajo."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la actividad *</Label>
              <Input value={actTitle} onChange={(e) => setActTitle(e.target.value)} placeholder="Ej: Revision de documentos contables" />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={actDescription} onChange={(e) => setActDescription(e.target.value)} rows={3} placeholder="Descripcion o notas adicionales..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Limite</Label>
                <Input type="date" value={actDueDate} onChange={(e) => setActDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Encargado</Label>
                <Select value={actAssignedTo || "none"} onValueChange={setActAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {Object.entries(usersByRole).map(([role, users]) => (
                      <SelectGroup key={role}>
                        <SelectLabel>{ROLE_LABELS[role as UserRole] || role}</SelectLabel>
                        {users.map((u) => (
                          <SelectItem key={u._id} value={u._id}>{u.displayName}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveActivity} disabled={!actTitle.trim() || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingActivity ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog subir documento */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Documento</DialogTitle>
            <DialogDescription>Seleccione un archivo de avance (max 10MB).</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Archivo</Label>
            <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancelar</Button>
            <Button onClick={handleUploadFile} disabled={!uploadFile || uploadLoading}>
              {uploadLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog observacion (administrativo) */}
      <Dialog open={showObsDialog} onOpenChange={setShowObsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {OBSERVATION_TYPE_LABELS[obsType]}
            </DialogTitle>
            <DialogDescription>Agregue un comentario para esta actividad.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={obsType} onValueChange={(v) => setObsType(v as ObservationType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OBSERVATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{OBSERVATION_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comentario *</Label>
              <Textarea
                value={obsComment}
                onChange={(e) => setObsComment(e.target.value)}
                rows={4}
                placeholder="Escriba su observacion..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowObsDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveObservation} disabled={!obsComment.trim() || obsSaving}>
              {obsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog recalcular fechas */}
      <Dialog open={showRecalcDialog} onOpenChange={setShowRecalcDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Recalcular Fechas
            </DialogTitle>
            <DialogDescription>
              Ingrese la nueva fecha de finalizacion estimada. Las fechas de las actividades se recalcularan proporcionalmente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nueva Fecha de Finalizacion *</Label>
            <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecalcDialog(false)}>Cancelar</Button>
            <Button onClick={handleRecalculateDates} disabled={!newEndDate || recalcSaving}>
              {recalcSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Recalcular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
