"use client";

// Módulo de comité: una decisión de Junta, su motivo y el valor fijado.

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Gavel } from "lucide-react";
import {
  COMMITTEE_VIABILITIES,
  COMMITTEE_VIABILITY_LABELS,
  COMMITTEE_VIABILITY_COLORS,
  type CommitteeReview,
  type CommitteeViability,
} from "@/lib/types";
import { canManageCommittee } from "@/lib/auth/permissions";

interface CommitteeTabProps {
  caseId: string;
  userRole: string;
  allRoles?: boolean;
}

export default function CommitteeTab({ caseId, userRole, allRoles = false }: CommitteeTabProps) {
  const canEdit = canManageCommittee(userRole as Parameters<typeof canManageCommittee>[0], allRoles);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [review, setReview] = useState<CommitteeReview | null>(null);

  const [viability, setViability] = useState<string>("");
  const [viabilityReason, setViabilityReason] = useState("");
  const [fees, setFees] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/committee`);
      const json = await res.json();
      if (json.success && json.data) {
        const r = json.data as CommitteeReview;
        setReview(r);
        setViability(r.viability ?? "");
        setViabilityReason(r.viabilityReason ?? "");
        setFees(r.fees != null ? String(r.fees) : "");
      }
    } catch {
      /* primera vez: sin decisión aún */
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setError("");
    setSuccess("");
    if (!viability) {
      setError("Debe definir la viabilidad del caso");
      return;
    }
    if (!viabilityReason.trim()) {
      setError("Debe registrar el motivo de la decisión");
      return;
    }
    if (!fees || Number(fees) <= 0) {
      setError("Debe fijar un valor mayor a cero");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/committee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viability,
          viabilityReason: viabilityReason.trim(),
          fees: parseFloat(fees),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReview(json.data);
        setSuccess("Decisión de la Junta guardada");
      } else {
        setError(json.error || "Error guardando la decisión");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const viabilityColor = review?.viability ? COMMITTEE_VIABILITY_COLORS[review.viability] : null;

  return (
    <div className="space-y-6">
      {/* Estado actual de la decisión */}
      <div className="flex items-center gap-3 flex-wrap">
        <Gavel className="h-5 w-5 text-muted-foreground" />
        {review?.viability && viabilityColor ? (
          <>
            <Badge className={`${viabilityColor.bg} ${viabilityColor.text} border-0`}>
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${viabilityColor.dot}`} />
              {COMMITTEE_VIABILITY_LABELS[review.viability]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Decidido por {review.decidedBy?.displayName || "Junta"}
              {review.decidedAt
                ? ` el ${new Date(review.decidedAt).toLocaleDateString("es-CO")}`
                : ""}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            La Junta aún no ha dictaminado este caso
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Viabilidad</Label>
          <Select value={viability} onValueChange={setViability} disabled={!canEdit}>
            <SelectTrigger>
              <SelectValue placeholder="Definir viabilidad..." />
            </SelectTrigger>
            <SelectContent>
              {COMMITTEE_VIABILITIES.map((v: CommitteeViability) => (
                <SelectItem key={v} value={v}>
                  {COMMITTEE_VIABILITY_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor fijado por la Junta (COP) *</Label>
          <Input
            type="number"
            min="0"
            value={fees}
            onChange={(e) => setFees(e.target.value)}
            placeholder="0"
            disabled={!canEdit}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Justificación de viabilidad
          <span className="text-destructive"> *</span>
        </Label>
        <Textarea
          value={viabilityReason}
          onChange={(e) => setViabilityReason(e.target.value)}
          placeholder="Motivo jurídico y técnico de la decisión"
          rows={2}
          disabled={!canEdit}
        />
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar decisión de Junta"}
          </Button>
        </div>
      )}
    </div>
  );
}
