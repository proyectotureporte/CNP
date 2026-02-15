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
  FileText, CreditCard, CheckCircle, XCircle, Loader2,
} from "lucide-react";
import {
  DISCIPLINE_LABELS,
  EXPERT_AVAILABILITY_LABELS, EXPERT_AVAILABILITY_COLORS,
  EXPERT_VALIDATION_LABELS, EXPERT_VALIDATION_COLORS,
  type Expert, type CaseDiscipline,
  type ExpertAvailability, type ExpertValidationStatus,
} from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

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

  const canValidate = user && ["admin", "comite"].includes(user.role);

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

  async function handleValidate(action: "aprobado" | "rechazado", notes?: string) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/experts/${id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes || "" }),
      });
      const data = await res.json();
      if (data.success) {
        setExpert((prev) => prev ? { ...prev, validationStatus: action as ExpertValidationStatus } : null);
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {expert.user?.displayName || "Sin nombre"}
            </h1>
            <Badge className={`${valColor?.bg} ${valColor?.text} border-0`}>
              {EXPERT_VALIDATION_LABELS[expert.validationStatus]}
            </Badge>
            <Badge className={`${availColor?.bg} ${availColor?.text} border-0`}>
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${availColor?.dot}`} />
              {EXPERT_AVAILABILITY_LABELS[expert.availability]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {expert.specialization || "Sin especializacion"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/crm/experts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/crm/experts/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          {canValidate && expert.validationStatus === "pendiente" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => setShowRejectDialog(true)}
                disabled={actionLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleValidate("aprobado")}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Aprobar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              Disciplinas y Especializacion
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
                  <p className="text-xs text-muted-foreground">Especializacion</p>
                  <p className="text-sm mt-0.5">{expert.specialization}</p>
                </div>
              </>
            )}
            {expert.baseFee && (
              <div>
                <p className="text-xs text-muted-foreground">Tarifa Base</p>
                <p className="text-sm font-medium">
                  ${expert.baseFee.toLocaleString("es-CO")} {expert.feeCurrency}
                </p>
              </div>
            )}
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
              <CardTitle className="text-base">Notas de Validacion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{expert.validationNotes}</p>
              {expert.validatedBy && (
                <p className="text-xs text-muted-foreground mt-2">
                  Validado por: {expert.validatedBy.displayName}
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
              onClick={() => handleValidate("rechazado", rejectNotes)}
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
