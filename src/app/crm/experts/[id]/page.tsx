"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Pencil, Star, MapPin, Briefcase, Phone, Mail,
  FileText, CreditCard, CheckCircle, XCircle, Loader2, GraduationCap, Layers, ArrowRight, RotateCcw,
} from "lucide-react";
import {
  DISCIPLINE_LABELS,
  EXPERT_AVAILABILITY_LABELS, EXPERT_AVAILABILITY_COLORS,
  EXPERT_VALIDATION_LABELS, EXPERT_VALIDATION_COLORS,
  EXPERT_SENIORITIES, EXPERT_SENIORITY_LABELS, EXPERT_SENIORITY_COLORS,
  EXPERT_CATEGORIES, EXPERT_CATEGORY_LABELS, EXPERT_CATEGORY_COLORS,
  type Expert, type CaseDiscipline,
  type ExpertValidationStatus, type ExpertSeniority, type ExpertCategory, type UserRole,
} from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { canManageExperts } from "@/lib/auth/permissions";

// Transiciones disponibles del ciclo de vida según el estado actual.
const PIPELINE: Record<ExpertValidationStatus, { to: ExpertValidationStatus; label: string; kind: "go" | "reject" | "back" }[]> = {
  candidato: [
    { to: "en_evaluacion", label: "Pasar a Evaluación", kind: "go" },
    { to: "rechazado", label: "Rechazar", kind: "reject" },
  ],
  en_evaluacion: [
    { to: "activado", label: "Activar Perito", kind: "go" },
    { to: "rechazado", label: "Rechazar", kind: "reject" },
  ],
  activado: [
    { to: "en_evaluacion", label: "Volver a Evaluación", kind: "back" },
  ],
  rechazado: [
    { to: "candidato", label: "Reabrir como Candidato", kind: "back" },
  ],
};

export default function ExpertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const canManage = !!user && canManageExperts(user.role as UserRole);

  useEffect(() => {
    async function loadExpert() {
      try {
        const res = await fetch(`/api/experts/${id}`);
        const data = await res.json();
        if (data.success) {
          setExpert(data.data);
        } else {
          setError(data.error || "Perito no encontrado");
        }
      } catch {
        setError("Error al cargar perito");
      } finally {
        setLoading(false);
      }
    }
    loadExpert();
  }, [id]);

  async function handleTransition(status: ExpertValidationStatus, notes?: string) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/experts/${id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notes || "" }),
      });
      const data = await res.json();
      if (data.success) {
        setExpert((prev) => prev ? { ...prev, validationStatus: status, validationNotes: notes || prev.validationNotes } : null);
        setShowRejectDialog(false);
        setRejectNotes("");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReclassify(patch: { seniority?: ExpertSeniority | null; category?: ExpertCategory | null }) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/experts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        setExpert((prev) => prev ? { ...prev, ...patch } : null);
      } else {
        setError(data.error || "Error reclasificando");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error && !expert) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!expert) return null;

  const availColor = EXPERT_AVAILABILITY_COLORS[expert.availability];
  const valColor = EXPERT_VALIDATION_COLORS[expert.validationStatus];
  const senColor = expert.seniority ? EXPERT_SENIORITY_COLORS[expert.seniority] : null;
  const catColor = expert.category ? EXPERT_CATEGORY_COLORS[expert.category] : null;
  const actions = PIPELINE[expert.validationStatus] ?? [];

  return (
    <>
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/crm/experts" className="hover:text-primary transition-colors">
          Peritos
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {expert.user?.displayName || "Perito"}
        </span>
      </nav>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {expert.user?.displayName || "Sin nombre"}
            </h1>
            <Badge className={`${valColor?.bg} ${valColor?.text} border-0`}>
              {EXPERT_VALIDATION_LABELS[expert.validationStatus]}
            </Badge>
            {senColor && (
              <Badge className={`${senColor.bg} ${senColor.text} border-0`}>
                <GraduationCap className="mr-1 h-3.5 w-3.5" />
                {EXPERT_SENIORITY_LABELS[expert.seniority!]}
              </Badge>
            )}
            <Badge className={`${availColor?.bg} ${availColor?.text} border-0`}>
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${availColor?.dot}`} />
              {EXPERT_AVAILABILITY_LABELS[expert.availability]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {expert.category ? EXPERT_CATEGORY_LABELS[expert.category] : "Sin categoría"}
            {expert.specialization ? ` · ${expert.specialization}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/crm/experts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          {canManage && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/crm/experts/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
          {canManage && actions.map((a) => (
            a.kind === "reject" ? (
              <Button
                key={a.to}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => setShowRejectDialog(true)}
                disabled={actionLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {a.label}
              </Button>
            ) : (
              <Button
                key={a.to}
                size="sm"
                className={a.kind === "go" ? "bg-green-600 hover:bg-green-700" : ""}
                variant={a.kind === "back" ? "outline" : "default"}
                onClick={() => handleTransition(a.to)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : a.kind === "go" ? (
                  <ArrowRight className="mr-2 h-4 w-4" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                {a.label}
              </Button>
            )
          ))}
        </div>
      </div>

      {/* Pipeline visual */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto">
        {(["candidato", "en_evaluacion", "activado"] as ExpertValidationStatus[]).map((st, i) => {
          const reached =
            (["candidato", "en_evaluacion", "activado"] as string[]).indexOf(expert.validationStatus) >= i ||
            expert.validationStatus === "activado";
          const isCurrent = expert.validationStatus === st;
          const c = EXPERT_VALIDATION_COLORS[st];
          return (
            <div key={st} className="flex items-center gap-2 whitespace-nowrap">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${reached ? `${c.bg} ${c.text}` : "bg-muted text-muted-foreground"} ${isCurrent ? "ring-2 ring-offset-1 ring-current" : ""}`}>
                {EXPERT_VALIDATION_LABELS[st]}
              </span>
              {i < 2 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          );
        })}
        {expert.validationStatus === "rechazado" && (
          <span className="ml-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">Rechazado</span>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Clasificación */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Clasificación del Perito
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Nivel (seniority)</p>
              {senColor ? (
                <Badge className={`${senColor.bg} ${senColor.text} border-0`}>{EXPERT_SENIORITY_LABELS[expert.seniority!]}</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Sin clasificar</Badge>
              )}
              {canManage && (
                <Select
                  value={expert.seniority ?? "none"}
                  onValueChange={(v) => handleReclassify({ seniority: v === "none" ? null : (v as ExpertSeniority) })}
                >
                  <SelectTrigger className="mt-1 h-8"><SelectValue placeholder="Reclasificar nivel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin clasificar</SelectItem>
                    {EXPERT_SENIORITIES.map((s) => (
                      <SelectItem key={s} value={s}>{EXPERT_SENIORITY_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Macro-categoría</p>
              {catColor ? (
                <Badge className={`${catColor.bg} ${catColor.text} border-0`}>
                  <Layers className="mr-1 h-3 w-3" />{EXPERT_CATEGORY_LABELS[expert.category!]}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Sin categoría</Badge>
              )}
              {canManage && (
                <Select
                  value={expert.category ?? "none"}
                  onValueChange={(v) => handleReclassify({ category: v === "none" ? null : (v as ExpertCategory) })}
                >
                  <SelectTrigger className="mt-1 h-8"><SelectValue placeholder="Cambiar categoría" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {EXPERT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{EXPERT_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Formación académica</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  {expert.pregrado ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                  Pregrado
                </li>
                <li className="text-muted-foreground">Especializaciones: <span className="font-medium text-foreground">{expert.numEspecializaciones ?? 0}</span></li>
                <li className="text-muted-foreground">Maestrías: <span className="font-medium text-foreground">{expert.numMaestrias ?? 0}</span></li>
                <li className="flex items-center gap-2">
                  {expert.doctorado ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                  Doctorado
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacion Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expert.user?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{expert.user.email}</span>
              </div>
            )}
            {expert.user?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{expert.user.phone}</span>
              </div>
            )}
            {expert.city && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{expert.city}{expert.region ? `, ${expert.region}` : ""}</span>
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">NIT/Cedula</p>
                <p className="text-sm font-medium">{expert.taxId || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarjeta Profesional</p>
                <p className="text-sm font-medium">{expert.professionalCard || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estadisticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-amber-50 p-4 text-center">
                <Star className="mx-auto h-5 w-5 text-amber-500 mb-1" />
                <p className="text-2xl font-bold text-amber-700">{(expert.rating || 0).toFixed(1)}</p>
                <p className="text-xs text-amber-600">Calificacion</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <Briefcase className="mx-auto h-5 w-5 text-blue-500 mb-1" />
                <p className="text-2xl font-bold text-blue-700">{expert.experienceYears || 0}</p>
                <p className="text-xs text-blue-600">Anos Exp.</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{expert.completedCases || 0}</p>
                <p className="text-xs text-green-600">Completados</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">{expert.totalCases || 0}</p>
                <p className="text-xs text-purple-600">Total Casos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disciplines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Disciplinas y Especialización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {expert.disciplines?.map((d) => (
                <Badge key={d} variant="secondary">
                  {DISCIPLINE_LABELS[d as CaseDiscipline] || d}
                </Badge>
              ))}
            </div>
            {expert.specialization && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Especialización</p>
                  <p className="text-sm mt-0.5">{expert.specialization}</p>
                </div>
              </>
            )}
            {expert.subespecialidad && (
              <div>
                <p className="text-xs text-muted-foreground">Subespecialidad</p>
                <p className="text-sm mt-0.5">{expert.subespecialidad}</p>
              </div>
            )}
            {expert.baseFee ? (
              <div>
                <p className="text-xs text-muted-foreground">Tarifa Base</p>
                <p className="text-sm font-medium">
                  ${expert.baseFee.toLocaleString("es-CO")} {expert.feeCurrency}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Banking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Datos Bancarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Banco</p>
                <p className="text-sm font-medium">{expert.bankName || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo de Cuenta</p>
                <p className="text-sm font-medium capitalize">{expert.bankAccountType || "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Numero de Cuenta</p>
              <p className="text-sm font-medium font-mono">{expert.bankAccountNumber || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Validation Notes */}
        {expert.validationNotes && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Notas de Evaluación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{expert.validationNotes}</p>
              {expert.validatedBy && (
                <p className="text-xs text-muted-foreground mt-2">
                  Actualizado por: {expert.validatedBy.displayName}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Perito</DialogTitle>
            <DialogDescription>
              Indique la razon por la cual se rechaza al perito {expert.user?.displayName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectNotes">Notas de rechazo *</Label>
            <Textarea
              id="rejectNotes"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Explique la razon del rechazo..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleTransition("rechazado", rejectNotes)}
              disabled={!rejectNotes.trim() || actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
