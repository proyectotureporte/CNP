"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  Copy,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
  UserCheck,
} from "lucide-react";
import { ActionPillButton } from "@/components/ui/action-pill-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CASE_STATUS_COLORS,
  CASE_STATUS_LABELS,
  DISCIPLINE_LABELS,
  EXPERT_AVAILABILITY_COLORS,
  EXPERT_AVAILABILITY_LABELS,
  EXPERT_CATEGORY_LABELS,
  EXPERT_SENIORITY_COLORS,
  EXPERT_SENIORITY_LABELS,
  EXPERT_VALIDATION_COLORS,
  EXPERT_VALIDATION_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  type CaseDiscipline,
  type CaseExpanded,
  type CaseStatus,
  type Expert,
} from "@/lib/types";

interface ExpertCardGridProps {
  experts: Expert[];
  canAssign: boolean;
  onAssigned?: () => void;
}

interface AssignmentOptions {
  eligible: boolean;
  reasons: string[];
  expertUserId: string | null;
  disciplines: string[];
  cases: CaseExpanded[];
}

interface ExpertFieldProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  copied: boolean;
  onCopy: () => void;
}

function ExpertField({ icon, label, value, copied, onCopy }: ExpertFieldProps) {
  const normalized = value?.trim();

  return (
    <div className="min-w-0 rounded-xl bg-muted/45 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
          <span className="shrink-0" aria-hidden="true">{icon}</span>
          <span className="truncate">{label}</span>
        </p>
        <button
          type="button"
          onClick={onCopy}
          disabled={!normalized}
          aria-label={`Copiar ${label.toLowerCase()}`}
          title={normalized ? `Copiar ${label.toLowerCase()}` : `${label} sin información`}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-white hover:text-[#1b5697] focus-visible:ring-2 focus-visible:ring-[#2969b0] disabled:cursor-not-allowed disabled:opacity-35"
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <p
        title={normalized || undefined}
        className={`mt-0.5 truncate text-xs leading-4 ${normalized ? "text-foreground" : "italic text-muted-foreground"}`}
      >
        {normalized || "Sin información"}
      </p>
    </div>
  );
}

function formatDeadline(value?: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function AssignmentCaseCard({
  item,
  disabled,
  assigning,
  onAssign,
}: {
  item: CaseExpanded;
  disabled: boolean;
  assigning: boolean;
  onAssign: () => void;
}) {
  const brand = item.brand || "CNP";
  const statusColor = CASE_STATUS_COLORS[item.status as CaseStatus];
  const priorityColor = PRIORITY_COLORS[item.priority];

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-0.5 ${brand === "Peritus" ? "bg-violet-500" : "bg-sky-500"}`}
      />
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge className={`shrink-0 border-0 text-[10px] ${
            brand === "Peritus" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
          }`}>
            {brand}
          </Badge>
          <span className="truncate font-mono text-[10px] text-muted-foreground">{item.caseCode}</span>
        </div>
        <Badge className={`shrink-0 border-0 text-[10px] ${statusColor?.bg} ${statusColor?.text}`}>
          <span className={`mr-1.5 size-1.5 rounded-full ${statusColor?.dot}`} />
          {CASE_STATUS_LABELS[item.status as CaseStatus] || item.status}
        </Badge>
      </div>

      <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-foreground" title={item.title}>
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-muted-foreground" title={item.dictamenObject || undefined}>
        {item.dictamenObject || "Sin objeto del dictamen"}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-3 text-xs">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground">Cliente</p>
          <p className="mt-0.5 truncate font-medium text-foreground" title={item.client?.name}>
            {item.client?.name || "-"}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground">Disciplina</p>
          <p className="mt-0.5 truncate font-medium text-foreground">
            {DISCIPLINE_LABELS[item.discipline as CaseDiscipline] || item.discipline}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground">Prioridad</p>
          <Badge className={`mt-0.5 border-0 px-2 py-0 text-[10px] ${priorityColor?.bg} ${priorityColor?.text}`}>
            {PRIORITY_LABELS[item.priority] || item.priority}
          </Badge>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground">Entrega</p>
          <p className="mt-0.5 flex items-center gap-1 truncate font-medium text-foreground">
            <CalendarClock className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            {formatDeadline(item.deadlineDate)}
          </p>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        disabled={disabled || assigning}
        onClick={onAssign}
        className="mt-3 w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
      >
        {assigning ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
        {assigning ? "Asignando..." : "Asignar este caso"}
      </Button>
    </article>
  );
}

export default function ExpertCardGrid({ experts, canAssign, onAssigned }: ExpertCardGridProps) {
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOptions | null>(null);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assigningCaseId, setAssigningCaseId] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const filteredCases = useMemo(() => {
    const list = assignmentOptions?.cases || [];
    const query = assignmentSearch.trim().toLocaleLowerCase("es");
    if (!query) return list;

    return list.filter((item) => [item.caseCode, item.title, item.client?.name]
      .some((value) => value?.toLocaleLowerCase("es").includes(query)));
  }, [assignmentOptions, assignmentSearch]);

  async function copyValue(expertId: string, field: string, label: string, value?: string | null) {
    const normalized = value?.trim();
    if (!normalized) return;
    try {
      await navigator.clipboard.writeText(normalized);
      setCopiedKey(`${expertId}:${field}`);
      setCopyMessage(`${label} copiado`);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => {
        setCopiedKey("");
        setCopyMessage("");
      }, 1800);
    } catch {
      setCopyMessage(`No se pudo copiar ${label.toLowerCase()}`);
    }
  }

  async function openAssignment(expertItem: Expert) {
    setSelectedExpert(expertItem);
    setAssignmentOpen(true);
    setAssignmentLoading(true);
    setAssignmentOptions(null);
    setAssignmentError("");
    setAssignmentSuccess("");
    setAssignmentSearch("");
    try {
      const response = await fetch(`/api/experts/${expertItem._id}/assignable-cases`);
      const body = await response.json();
      if (!response.ok || !body.success) {
        setAssignmentError(body.error || "No se pudieron cargar los casos disponibles.");
        return;
      }
      setAssignmentOptions(body.data);
    } catch {
      setAssignmentError("Error de conexión al cargar los casos disponibles.");
    } finally {
      setAssignmentLoading(false);
    }
  }

  function openAssociatedCases(expertItem: Expert) {
    const count = expertItem.associatedCasesCount || 0;
    if (count === 1 && expertItem.soleAssociatedCaseId) {
      router.push(`/crm/cases/${expertItem.soleAssociatedCaseId}`);
      return;
    }

    const expertUserId = expertItem.user?._id;
    if (!expertUserId) return;
    const params = new URLSearchParams({
      expertId: expertUserId,
      expertName: expertItem.user?.displayName || "Perito",
    });
    router.push(`/crm/cases?${params.toString()}`);
  }

  async function assignCase(item: CaseExpanded) {
    const expertUserId = assignmentOptions?.expertUserId;
    if (!expertUserId || !assignmentOptions?.eligible) return;

    setAssigningCaseId(item._id);
    setAssignmentError("");
    setAssignmentSuccess("");
    try {
      const response = await fetch(`/api/cases/${item._id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "assignedExpert", userId: expertUserId }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setAssignmentError(body.error || "No se pudo asignar el caso.");
        return;
      }

      setAssignmentOptions((current) => current
        ? { ...current, cases: current.cases.filter((caseItem) => caseItem._id !== item._id) }
        : current);
      setAssignmentSuccess(`${item.caseCode} fue asignado a ${selectedExpert?.user?.displayName || "este perito"}.`);
      onAssigned?.();
    } catch {
      setAssignmentError("Error de conexión al asignar el caso.");
    } finally {
      setAssigningCaseId("");
    }
  }

  if (experts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center shadow-sm">
        <Search className="mx-auto size-12 text-muted-foreground/35" aria-hidden="true" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">No se encontraron peritos</h3>
      </div>
    );
  }

  return (
    <>
      <p className="sr-only" aria-live="polite">{copyMessage}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {experts.map((expertItem) => {
          const validationColor = EXPERT_VALIDATION_COLORS[expertItem.validationStatus];
          const availabilityColor = EXPERT_AVAILABILITY_COLORS[expertItem.availability];
          const seniorityColor = expertItem.seniority ? EXPERT_SENIORITY_COLORS[expertItem.seniority] : null;
          const name = expertItem.user?.displayName || "Sin nombre";
          const associatedCasesCount = expertItem.associatedCasesCount || 0;

          return (
            <article
              key={expertItem._id}
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white p-4 shadow-sm"
            >
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-[#2969b0]" />

              <div className="flex min-w-0 items-center justify-between gap-2">
                <Badge className={`min-w-0 border-0 text-[10px] ${validationColor?.bg} ${validationColor?.text}`}>
                  <span className={`mr-1.5 size-1.5 shrink-0 rounded-full ${validationColor?.dot}`} />
                  <span className="truncate">{EXPERT_VALIDATION_LABELS[expertItem.validationStatus]}</span>
                </Badge>
                <Badge className={`shrink-0 border-0 text-[10px] ${availabilityColor?.bg} ${availabilityColor?.text}`}>
                  <span className={`mr-1.5 size-1.5 rounded-full ${availabilityColor?.dot}`} />
                  {EXPERT_AVAILABILITY_LABELS[expertItem.availability]}
                </Badge>
              </div>

              <div className="mt-3 min-w-0">
                <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground" title={name}>{name}</h2>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <p className="min-w-0 truncate text-[11px] text-muted-foreground">
                    {expertItem.category ? EXPERT_CATEGORY_LABELS[expertItem.category] : "Perito externo"}
                  </p>
                  {expertItem.seniority && seniorityColor && (
                    <Badge className={`h-5 shrink-0 border border-white/50 px-2 text-[9px] ${seniorityColor.bg} ${seniorityColor.text}`}>
                      <span className={`mr-1 size-1.5 rounded-full ${seniorityColor.dot}`} />
                      {EXPERT_SENIORITY_LABELS[expertItem.seniority]}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border/50 pt-3">
                <ExpertField
                  icon={<Mail className="size-3" />}
                  label="Mail"
                  value={expertItem.user?.email}
                  copied={copiedKey === `${expertItem._id}:email`}
                  onCopy={() => copyValue(expertItem._id, "email", "Mail", expertItem.user?.email)}
                />
                <div className={`grid gap-2 ${canAssign ? "grid-cols-2" : "grid-cols-1"}`}>
                  <ExpertField
                    icon={<Phone className="size-3" />}
                    label="Teléfono"
                    value={expertItem.user?.phone}
                    copied={copiedKey === `${expertItem._id}:phone`}
                    onCopy={() => copyValue(expertItem._id, "phone", "Teléfono", expertItem.user?.phone)}
                  />
                  <ExpertField
                    icon={<MapPin className="size-3" />}
                    label="Ciudad"
                    value={expertItem.city}
                    copied={copiedKey === `${expertItem._id}:city`}
                    onCopy={() => copyValue(expertItem._id, "city", "Ciudad", expertItem.city)}
                  />
                </div>
                <ExpertField
                  icon={<BriefcaseBusiness className="size-3" />}
                  label="Especialización"
                  value={expertItem.specialization}
                  copied={copiedKey === `${expertItem._id}:specialization`}
                  onCopy={() => copyValue(expertItem._id, "specialization", "Especialización", expertItem.specialization)}
                />
              </div>

              <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
                {expertItem.disciplines?.map((discipline) => (
                  <Badge key={discipline} variant="outline" className="h-6 text-[10px]">
                    {DISCIPLINE_LABELS[discipline as CaseDiscipline] || discipline}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto border-t border-border/50 pt-3">
                <div className="mb-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex min-w-0 items-center gap-2">
                    <span>Casos: {associatedCasesCount}</span>
                    {associatedCasesCount > 0 && expertItem.user?._id && (
                      <button
                        type="button"
                        onClick={() => openAssociatedCases(expertItem)}
                        className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#1b5697] outline-none hover:text-[#123e70] hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#2969b0]"
                        aria-label={`${associatedCasesCount === 1 ? "Ver caso" : "Ver casos"} de ${name}`}
                      >
                        <BriefcaseBusiness className="size-3" aria-hidden="true" />
                        {associatedCasesCount === 1 ? "Ver caso" : "Ver casos"}
                      </button>
                    )}
                  </div>
                  <span>Calificación {(expertItem.rating || 0).toFixed(1)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ActionPillButton
                    type="button"
                    label="Editar"
                    icon={<Pencil className="size-3.5" />}
                    tone="blue"
                    className="min-h-8 px-3 py-1.5 text-xs"
                    onClick={() => router.push(`/crm/experts/${expertItem._id}`)}
                  />
                  {canAssign && (
                    <ActionPillButton
                      type="button"
                      label="Asignar caso"
                      icon={<UserCheck className="size-3.5" />}
                      tone="green"
                      className="min-h-8 px-3 py-1.5 text-xs"
                      onClick={() => openAssignment(expertItem)}
                    />
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="size-5 text-emerald-600" />
              Asignar caso a {selectedExpert?.user?.displayName || "perito"}
            </DialogTitle>
            <DialogDescription>
              Casos operativos sin perito que coinciden con las disciplinas de este perfil.
            </DialogDescription>
          </DialogHeader>

          {assignmentLoading ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Cargando casos disponibles...
            </div>
          ) : assignmentError && !assignmentOptions ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              {assignmentError}
            </div>
          ) : assignmentOptions ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              {!assignmentOptions.eligible && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="status">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="size-4" />
                    Este perito todavía no puede recibir casos
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                    {assignmentOptions.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                </div>
              )}

              {assignmentSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
                  <p className="flex items-center gap-2 font-semibold"><Check className="size-4" />{assignmentSuccess}</p>
                </div>
              )}
              {assignmentError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                  {assignmentError}
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={assignmentSearch}
                  onChange={(event) => setAssignmentSearch(event.target.value)}
                  placeholder="Buscar por caso, cliente o código..."
                  className="pl-9"
                />
              </div>

              <div className="min-h-0 overflow-y-auto pr-1">
                {filteredCases.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
                    <BriefcaseBusiness className="mx-auto size-10 text-muted-foreground/35" />
                    <p className="mt-3 text-sm font-semibold text-foreground">No hay casos disponibles</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      No existen casos sin asignar que coincidan con este perfil y la búsqueda actual.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {filteredCases.map((item) => (
                      <AssignmentCaseCard
                        key={item._id}
                        item={item}
                        disabled={!assignmentOptions.eligible || Boolean(assigningCaseId)}
                        assigning={assigningCaseId === item._id}
                        onAssign={() => assignCase(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
