"use client";

import { use, useEffect, useState, useCallback } from "react";
import { usePusher } from "@/hooks/usePusher";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import CaseMessages from "@/components/cases/CaseMessages";
import CasePaymentsTab from "@/components/cases/CasePaymentsTab";
import ExecutionClockCard from "@/components/cases/ExecutionClockCard";
import CommitteeTab from "@/components/cases/CommitteeTab";
import ContractTab from "@/components/cases/ContractTab";
import { Textarea } from "@/components/ui/textarea";
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
  CASE_CHANNEL_LABELS,
  COMMERCIAL_STATUS_LABELS, COMMERCIAL_STATUS_COLORS,
  ALL_ROLE_CASE_TABS, ROLE_CASE_TABS,
  type CaseExpanded, type CaseStatus, type CaseComplexity, type CasePriority,
  type CaseEvent, type CaseEventType, type CaseChannel, type CommercialStatus,
} from "@/lib/types";
import { VALID_TRANSITIONS, COMMERCIAL_TRANSITIONS } from "@/lib/cases/stateMachine";
import {
  canAddCaseTimelineNote,
  canAssignExpert,
  canChangeCommercialStatus,
  canEditCase,
} from "@/lib/auth/permissions";
import { useAuth } from "@/hooks/useAuth";

const EMPTY_CASE_TABS: string[] = [];

// Returns available transitions based on role and chain
function getAvailableTransitions(status: CaseStatus, role: string, allRoles = false): CaseStatus[] {
  return allRoles || role === 'comercial_juridico' ? VALID_TRANSITIONS[status] || [] : [];
}

interface AssignmentOption {
  userId: string;
  displayName: string;
  specialization?: string;
  city?: string;
  rating?: number;
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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<CaseExpanded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusChanging, setStatusChanging] = useState(false);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'internal' | 'external'>('internal');
  const [assignmentOptions, setAssignmentOptions] = useState<{ internal: AssignmentOption[]; external: AssignmentOption[] }>({ internal: [], external: [] });
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [commercialChanging, setCommercialChanging] = useState(false);
  const [showLossDialog, setShowLossDialog] = useState(false);
  const [lossReason, setLossReason] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const userRole = user?.role || '';
  const visibleTabs = user?.allRoles ? ALL_ROLE_CASE_TABS : ROLE_CASE_TABS[userRole] || EMPTY_CASE_TABS;

  useEffect(() => {
    const requested = searchParams.get("tab");
    if (requested && visibleTabs.includes(requested)) setActiveTab(requested);
  }, [searchParams, visibleTabs]);

  const loadEvents = useCallback(async () => {
    try {
      const eventsRes = await fetch(`/api/cases/${id}/events`);
      const eventsJson = await eventsRes.json();
      if (eventsJson.success) setEvents(eventsJson.data);
    } catch { /* ignore */ }
  }, [id]);

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
  }, [activeTab, loadEvents]);

  async function handleStatusChange(newStatus: string) {
    await executeStatusChange(newStatus);
  }

  async function executeStatusChange(newStatus: string) {
    setStatusChanging(true);
    try {
      const res = await fetch(`/api/cases/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCaseData((prev) => {
          if (!prev) return null;
          return { ...prev, status: newStatus as CaseStatus };
        });
      } else {
        setError(data.error || "Error al cambiar estado");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setStatusChanging(false);
    }
  }

  async function openAssignmentDialog() {
    setShowAssignmentDialog(true);
    setAssignmentType(['financiero', 'contable'].includes(caseData?.discipline || '') ? 'internal' : 'external');
    setSelectedAssigneeId("");
    setAssignmentLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${id}/assignment-options`);
      const data = await res.json();
      if (data.success) setAssignmentOptions(data.data);
      else setError(data.error || "Error obteniendo peritos disponibles");
    } catch {
      setError("Error de conexion");
    } finally {
      setAssignmentLoading(false);
    }
  }

  async function handleAssignExpert() {
    if (!selectedAssigneeId) return;
    setAssigning(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: assignmentType === 'external' ? 'assignedExpert' : 'assignedFinanciero',
          userId: selectedAssigneeId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCaseData(data.data);
        setShowAssignmentDialog(false);
        setSelectedAssigneeId("");
      } else {
        setError(data.error || "Error asignando el perito");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setAssigning(false);
    }
  }

  // --- Pipeline comercial (RF-18) ---
  async function executeCommercialChange(next: string, reason?: string) {
    setCommercialChanging(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${id}/commercial-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commercialStatus: next, lossReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        setCaseData((prev) => (prev ? { ...prev, commercialStatus: next as CommercialStatus, lossReason: reason ?? prev.lossReason } : null));
        setShowLossDialog(false);
        setLossReason("");
      } else {
        setError(data.error || "Error cambiando la etapa comercial");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setCommercialChanging(false);
    }
  }

  function handleCommercialChange(next: string) {
    if (next === "perdido") {
      setLossReason("");
      setShowLossDialog(true);
      return;
    }
    executeCommercialChange(next);
  }

  // --- Nota manual del timeline (RF-04) ---
  async function handleAddNote() {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/cases/${id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "comment", description: noteText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNoteText("");
        await loadEvents();
      } else {
        setError(data.error || "Error agregando la nota");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setNoteSaving(false);
    }
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
  const validNext = getAvailableTransitions(caseData.status, userRole, user?.allRoles);
  const commercialStatus = (caseData.commercialStatus ?? 'prospecto') as CommercialStatus;
  const commercialColor = COMMERCIAL_STATUS_COLORS[commercialStatus];
  const commercialNext = canChangeCommercialStatus(userRole as Parameters<typeof canChangeCommercialStatus>[0], user?.allRoles)
    ? COMMERCIAL_TRANSITIONS[commercialStatus] || []
    : [];
  const isCaseExpert = userRole === 'perito' || userRole === 'perito_interno';

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
            {!isCaseExpert && (
              <Badge className={`${commercialColor?.bg} ${commercialColor?.text} border-0`}>
                <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${commercialColor?.dot}`} />
                {COMMERCIAL_STATUS_LABELS[commercialStatus]}
              </Badge>
            )}
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {caseData.caseCode}
            {caseData.channel && (
              <span className="ml-2 font-sans text-xs">
                · Canal: {CASE_CHANNEL_LABELS[caseData.channel as CaseChannel] || caseData.channel}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/crm/cases")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          {canAssignExpert(userRole as Parameters<typeof canAssignExpert>[0], user?.allRoles) && (
            <Button variant="outline" size="sm" onClick={openAssignmentDialog}>
              <UserCheck className="mr-2 h-4 w-4" />
              Asignar perito
            </Button>
          )}
          {canEditCase(userRole as Parameters<typeof canEditCase>[0], user?.allRoles) && (
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
                    {CASE_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {commercialNext.length > 0 && (
            <Select onValueChange={handleCommercialChange} disabled={commercialChanging}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Etapa comercial..." />
              </SelectTrigger>
              <SelectContent>
                {commercialNext.map((s) => (
                  <SelectItem key={s} value={s}>
                    {COMMERCIAL_STATUS_LABELS[s]}
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
          {visibleTabs.includes('committee') && <TabsTrigger value="committee">Comité</TabsTrigger>}
          {visibleTabs.includes('quotes') && <TabsTrigger value="quotes">Cotizaciones</TabsTrigger>}
          {visibleTabs.includes('contract') && <TabsTrigger value="contract">Contratación</TabsTrigger>}
          {visibleTabs.includes('work-plan') && <TabsTrigger value="work-plan">Plan de Trabajo</TabsTrigger>}
          {visibleTabs.includes('deliverables') && <TabsTrigger value="deliverables">Entregas</TabsTrigger>}
          {visibleTabs.includes('payments') && <TabsTrigger value="payments">Pagos</TabsTrigger>}
          {visibleTabs.includes('messages') && <TabsTrigger value="messages">Mensajes</TabsTrigger>}
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
            {!isCaseExpert && <Card>
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
            </Card>}
          </div>

          <ExecutionClockCard caseId={id} userRole={userRole} allRoles={user?.allRoles} />

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
                {caseData.dictamenObject && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Objeto del dictamen</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{caseData.dictamenObject}</p>
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
                  {userRole === 'perito' ? (
                    <>
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs text-blue-700">Cliente final</p>
                        <p className="text-sm font-medium text-blue-950">Datos protegidos · contacto únicamente a través del Comercial Jurídico</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Comercial Jurídico asignado</p>
                        <p className="text-sm font-medium">{caseData.assignedJuridico?.displayName || "Pendiente de asignar"}</p>
                        {caseData.assignedJuridico?.email && <p className="text-xs text-muted-foreground">{caseData.assignedJuridico.email}</p>}
                        {caseData.assignedJuridico?.phone && <p className="text-xs text-muted-foreground">{caseData.assignedJuridico.phone}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div><p className="text-xs text-muted-foreground">Cliente</p><p className="text-sm font-medium">{caseData.client ? `${caseData.client.name} (${caseData.client.company || "Sin empresa"})` : "-"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Perito externo</p><p className="text-sm font-medium">{caseData.assignedExpert?.displayName || "-"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Perito interno</p><p className="text-sm font-medium">{caseData.assignedFinanciero?.displayName || "-"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Comercial Jurídico</p><p className="text-sm font-medium">{caseData.assignedJuridico?.displayName || "-"}</p></div>
                    </>
                  )}
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
              <DocumentList caseId={id} userRole={userRole} allRoles={user?.allRoles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="committee" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comité</CardTitle>
            </CardHeader>
            <CardContent>
              <CommitteeTab caseId={id} userRole={userRole} allRoles={user?.allRoles} />
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

        <TabsContent value="contract" className="mt-6">
          <ContractTab
            caseId={id}
            executionStartDate={caseData.executionStartDate}
            executionDeadline={caseData.executionDeadline}
          />
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
              <DeliverablesTab caseId={id} userRole={userRole} allRoles={user?.allRoles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <CasePaymentsTab caseId={id} userRole={userRole} allRoles={user?.allRoles} />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <CaseMessages caseId={id} userRole={userRole} readOnly={user?.allRoles} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {/* RF-04: nota manual a la bitácora */}
              {canAddCaseTimelineNote(userRole as Parameters<typeof canAddCaseTimelineNote>[0], user?.allRoles) && (
                <>
                  <div className="mb-6 space-y-2">
                    <Label>Agregar nota</Label>
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Escriba una nota o novedad del caso..."
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleAddNote} disabled={noteSaving || !noteText.trim()}>
                        {noteSaving ? "Guardando..." : "Agregar al timeline"}
                      </Button>
                    </div>
                  </div>
                  <Separator className="mb-6" />
                </>
              )}
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

      {/* Loss reason dialog (RF-10/RF-11) */}
      <Dialog open={showLossDialog} onOpenChange={setShowLossDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Marcar caso como perdido
            </DialogTitle>
            <DialogDescription>
              Indique el motivo de pérdida. Este dato alimenta las métricas del dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Motivo de pérdida *</Label>
            <Textarea
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              placeholder="Precio, tiempos, eligió otro proveedor..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLossDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => executeCommercialChange('perdido', lossReason.trim())}
              disabled={!lossReason.trim() || commercialChanging}
            >
              {commercialChanging ? "Guardando..." : "Confirmar pérdida"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expert assignment dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Asignar perito
            </DialogTitle>
            <DialogDescription>
              Elija si el caso será atendido por el perito interno de la firma o por un perito externo habilitado para la disciplina.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de perito</Label>
              <Select
                value={assignmentType}
                onValueChange={(value: 'internal' | 'external') => {
                  setAssignmentType(value);
                  setSelectedAssigneeId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Perito interno</SelectItem>
                  <SelectItem value="external">Perito externo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Perito</Label>
              {assignmentLoading ? (
                <p className="text-sm text-muted-foreground">Cargando peritos disponibles...</p>
              ) : assignmentOptions[assignmentType].length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay peritos {assignmentType === 'internal' ? 'internos' : 'externos habilitados para esta disciplina'} disponibles.
                </p>
              ) : (
                <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar perito..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentOptions[assignmentType].map((option) => (
                      <SelectItem key={option.userId} value={option.userId}>
                        {option.displayName}
                        {option.specialization ? ` · ${option.specialization}` : ''}
                        {option.city ? ` · ${option.city}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignExpert}
              disabled={!selectedAssigneeId || assigning || assignmentLoading}
            >
              {assigning ? "Asignando..." : "Confirmar asignación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
