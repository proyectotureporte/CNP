"use client";

import { use, useEffect, useState, useCallback } from "react";
import { usePusher } from "@/hooks/usePusher";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Gavel, FileText, Users, Clock, DollarSign,
  Pencil, ArrowLeft, AlertTriangle, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import DocumentList from "@/components/cases/DocumentList";
import QuoteList from "@/components/quotes/QuoteList";
import WorkPlanTab from "@/components/cases/WorkPlanTab";
import DeliverablesTab from "@/components/cases/DeliverablesTab";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CASE_STATUS_LABELS, CASE_STATUS_COLORS,
  DISCIPLINE_LABELS,
  COMPLEXITY_LABELS, COMPLEXITY_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  CASE_EVENT_LABELS,
  ROLE_CASE_TABS,
  type CaseExpanded, type CaseStatus, type CaseComplexity, type CasePriority,
  type CaseEvent, type CaseEventType,
} from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  creado: ['gestionado', 'cancelado'],
  gestionado: ['creado', 'cancelado'],
  cancelado: ['creado'],
};

// Returns available transitions based on role and chain
function getAvailableTransitions(
  status: CaseStatus,
  role: string,
  statusChangedByRole?: string
): CaseStatus[] {
  const transitions = VALID_TRANSITIONS[status] || [];
  if (role === 'admin') return transitions;

  // Juridico: only when case is in creado and no one changed it yet (or financiero returned it)
  if (role === 'juridico') {
    if (status === 'creado' && (!statusChangedByRole || statusChangedByRole === 'financiero')) {
      return ['gestionado', 'cancelado'];
    }
    return [];
  }

  // Financiero: only when juridico changed it (case is gestionado, changed by juridico)
  if (role === 'financiero') {
    if (statusChangedByRole === 'juridico') {
      // Can return to creado (devolver) or cancel
      if (status === 'gestionado') return ['creado', 'cancelado'];
    }
    return [];
  }

  return [];
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatCurrency(amount?: number) {
  if (!amount) return "-";
  return `$${amount.toLocaleString("es-CO")}`;
}

export default function CrmCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<CaseExpanded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusChanging, setStatusChanging] = useState(false);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFinancieroDialog, setShowFinancieroDialog] = useState(false);
  const [financieroUsers, setFinancieroUsers] = useState<{ _id: string; displayName: string; role: string }[]>([]);
  const [selectedFinancieroId, setSelectedFinancieroId] = useState("");

  const userRole = user?.role || 'admin';
  const visibleTabs = ROLE_CASE_TABS[userRole] || ROLE_CASE_TABS.admin;

  async function loadEvents() {
    try {
      const eventsRes = await fetch(`/api/cases/${id}/events`);
      const eventsJson = await eventsRes.json();
      if (eventsJson.success) setEvents(eventsJson.data);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    async function loadCase() {
      try {
        const [caseRes, eventsRes] = await Promise.all([
          fetch(`/api/cases/${id}`),
          fetch(`/api/cases/${id}/events`),
        ]);
        const caseJson = await caseRes.json();
        if (caseJson.success) {
          setCaseData(caseJson.data);
        } else {
          setError(caseJson.error || "Caso no encontrado");
        }
        const eventsJson = await eventsRes.json();
        if (eventsJson.success) {
          setEvents(eventsJson.data);
        }
      } catch {
        setError("Error al cargar el caso");
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [id, refreshKey]);

  usePusher(
    ['case:updated', 'case:status-changed', 'case:assigned', 'quote:created', 'quote:approved', 'quote:rejected',
     'activity:created', 'activity:updated', 'activity:deleted', 'deliverable:created', 'deliverable:reviewed',
     'document:created', 'hearing:created', 'payment:updated'],
    () => { setRefreshKey((k) => k + 1); }
  );

  // Recargar eventos al cambiar a la pestana Timeline
  useEffect(() => {
    if (activeTab === "timeline") loadEvents();
  }, [activeTab]);

  async function handleStatusChange(newStatus: string) {
    // If juridico selects gestionado, show the financiero picker dialog
    if (userRole === 'juridico' && newStatus === 'gestionado') {
      // Load financiero users
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.success) {
          const financieros = data.data.filter((u: { role: string }) => u.role === 'financiero');
          setFinancieroUsers(financieros);
        }
      } catch { /* ignore */ }
      setSelectedFinancieroId("");
      setShowFinancieroDialog(true);
      return;
    }

    await executeStatusChange(newStatus);
  }

  async function executeStatusChange(newStatus: string, assignedFinancieroId?: string) {
    setStatusChanging(true);
    try {
      const bodyPayload: Record<string, string> = { status: newStatus };
      if (assignedFinancieroId) {
        bodyPayload.assignedFinancieroId = assignedFinancieroId;
      }

      const res = await fetch(`/api/cases/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (data.success) {
        setCaseData((prev) => {
          if (!prev) return null;
          const updated = { ...prev, status: newStatus as CaseStatus };
          // Update the assignedFinanciero display if we just assigned one
          if (assignedFinancieroId) {
            const fin = financieroUsers.find((u) => u._id === assignedFinancieroId);
            if (fin) {
              updated.assignedFinanciero = { _id: fin._id, displayName: fin.displayName, email: '' };
            }
          }
          return updated;
        });
        setShowFinancieroDialog(false);
      } else {
        setError(data.error || "Error al cambiar estado");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setStatusChanging(false);
    }
  }

  function handleConfirmGestionado() {
    if (!selectedFinancieroId) {
      setError("Debe seleccionar un usuario financiero");
      return;
    }
    executeStatusChange('gestionado', selectedFinancieroId);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!caseData) return null;

  const statusColor = CASE_STATUS_COLORS[caseData.status];
  const complexityColor = COMPLEXITY_COLORS[caseData.complexity as CaseComplexity];
  const priorityColor = PRIORITY_COLORS[caseData.priority as CasePriority];
  const validNext = getAvailableTransitions(caseData.status, userRole, caseData.statusChangedByRole);
  const isReadOnlyForJuridico = userRole === 'juridico' && caseData.status !== 'creado';

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/crm/cases" className="hover:text-primary transition-colors">
          Casos
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{caseData.caseCode}</span>
      </nav>

      {/* Read-only banner for juridico */}
      {isReadOnlyForJuridico && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Este caso esta en estado <strong>{CASE_STATUS_LABELS[caseData.status]}</strong> y es de solo lectura. El financiero asignado puede devolverlo si necesita correccion.
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs border-0 ${
                (caseData.brand || "CNP") === "Peritus"
                  ? "bg-violet-100 text-violet-700"
                  : "bg-sky-100 text-sky-700"
              }`}
            >
              {caseData.brand || "CNP"}
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">{caseData.title}</h1>
            <Badge className={`${statusColor?.bg} ${statusColor?.text} border-0`}>
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusColor?.dot}`} />
              {CASE_STATUS_LABELS[caseData.status]}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{caseData.caseCode}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/crm/cases")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          {!isReadOnlyForJuridico && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/crm/cases/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
          {validNext.length > 0 && (
            <Select onValueChange={handleStatusChange} disabled={statusChanging}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Cambiar estado..." />
              </SelectTrigger>
              <SelectContent>
                {validNext.map((s) => (
                  <SelectItem key={s} value={s}>
                    {/* When financiero returns case to creado, show "Devolver" */}
                    {s === 'creado' && userRole === 'financiero'
                      ? 'Devolver a Juridico'
                      : CASE_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {visibleTabs.includes('summary') && <TabsTrigger value="summary">Resumen</TabsTrigger>}
          {visibleTabs.includes('documents') && <TabsTrigger value="documents">Documentos</TabsTrigger>}
          {visibleTabs.includes('quotes') && <TabsTrigger value="quotes">Cotizaciones</TabsTrigger>}
          {visibleTabs.includes('work-plan') && <TabsTrigger value="work-plan">Plan de Trabajo</TabsTrigger>}
          {visibleTabs.includes('deliverables') && <TabsTrigger value="deliverables">Entregas</TabsTrigger>}
          {visibleTabs.includes('timeline') && <TabsTrigger value="timeline">Timeline</TabsTrigger>}
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6 mt-6">
          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Disciplina</p>
                    <p className="font-medium">{DISCIPLINE_LABELS[caseData.discipline] || caseData.discipline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${complexityColor?.bg}`}>
                    <AlertTriangle className={`h-4 w-4 ${complexityColor?.text}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Complejidad</p>
                    <p className="font-medium">{COMPLEXITY_LABELS[caseData.complexity as CaseComplexity] || caseData.complexity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${priorityColor?.bg}`}>
                    <Clock className={`h-4 w-4 ${priorityColor?.text}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prioridad</p>
                    <p className="font-medium">{PRIORITY_LABELS[caseData.priority as CasePriority] || caseData.priority}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monto Estimado</p>
                    <p className="font-medium">{formatCurrency(caseData.estimatedAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Case Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informacion del Caso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {caseData.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Descripcion</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{caseData.description}</p>
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ciudad</p>
                      <p className="text-sm font-medium">{caseData.city || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Gavel className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Juzgado</p>
                      <p className="text-sm font-medium">{caseData.courtName || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Radicado</p>
                      <p className="text-sm font-medium font-mono">{caseData.caseNumber || "-"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates + People */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fechas Clave</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {caseData.hearingDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha de Audiencia</p>
                        <p className="text-sm font-medium">{formatDateTime(caseData.hearingDate)}</p>
                      </div>
                    </div>
                  )}
                  {caseData.hearingLink && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Enlace de Audiencia</p>
                        <a
                          href={caseData.hearingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {caseData.hearingLink}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha Limite</p>
                      <p className="text-sm font-medium">{formatDateTime(caseData.deadlineDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Creado</p>
                      <p className="text-sm font-medium">{formatDate(caseData._createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Asignaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="text-sm font-medium">
                      {caseData.client ? `${caseData.client.name} (${caseData.client.company || "Sin empresa"})` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Asesor Comercial</p>
                    <p className="text-sm font-medium">{caseData.commercial?.displayName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Analista Tecnico</p>
                    <p className="text-sm font-medium">{caseData.technicalAnalyst?.displayName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Perito Asignado</p>
                    <p className="text-sm font-medium">{caseData.assignedExpert?.displayName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Financiero Asignado</p>
                    <p className="text-sm font-medium">{caseData.assignedFinanciero?.displayName || "-"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentList caseId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cotizaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteList caseId={id} userRole={userRole} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-plan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan de Trabajo</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkPlanTab caseId={id} userRole={userRole} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverables" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entregas</CardTitle>
            </CardHeader>
            <CardContent>
              <DeliverablesTab caseId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay eventos registrados
                </p>
              ) : (
                <div className="relative space-y-0">
                  {events.map((event, index) => (
                    <div key={event._id} className="flex gap-4 pb-6 last:pb-0">
                      <div className="relative flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                        {index < events.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 -mt-0.5">
                        <p className="text-sm font-medium">
                          {CASE_EVENT_LABELS[event.eventType as CaseEventType] || event.eventType}
                        </p>
                        {event.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {event.createdBy?.displayName || event.createdByName || "Sistema"} &middot;{" "}
                          {new Date(event._createdAt).toLocaleString("es-CO", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Financiero assignment dialog */}
      <Dialog open={showFinancieroDialog} onOpenChange={setShowFinancieroDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Asignar Usuario Financiero
            </DialogTitle>
            <DialogDescription>
              Seleccione el usuario financiero que gestionara este caso. Solo este usuario podra ver el caso y su cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Usuario Financiero</Label>
              {financieroUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay usuarios financieros disponibles</p>
              ) : (
                <Select value={selectedFinancieroId} onValueChange={setSelectedFinancieroId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar financiero..." />
                  </SelectTrigger>
                  <SelectContent>
                    {financieroUsers.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinancieroDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmGestionado}
              disabled={!selectedFinancieroId || statusChanging}
            >
              {statusChanging ? "Asignando..." : "Confirmar y Gestionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
