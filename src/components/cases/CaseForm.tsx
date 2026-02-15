"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CASE_DISCIPLINES,
  DISCIPLINE_LABELS,
  CASE_COMPLEXITIES,
  COMPLEXITY_LABELS,
  CASE_PRIORITIES,
  PRIORITY_LABELS,
  type CaseExpanded,
} from "@/lib/types";

interface ClientOption {
  _id: string;
  name: string;
  company: string;
}

interface CaseFormProps {
  initialData?: CaseExpanded;
  caseId?: string;
}

export default function CaseForm({ initialData, caseId }: CaseFormProps) {
  const router = useRouter();
  const isEditing = !!caseId;

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [discipline, setDiscipline] = useState<string>(initialData?.discipline || "otro");
  const [complexity, setComplexity] = useState<string>(initialData?.complexity || "media");
  const [priority, setPriority] = useState<string>(initialData?.priority || "normal");
  const [clientId, setClientId] = useState(initialData?.client?._id || "");
  const [estimatedAmount, setEstimatedAmount] = useState(
    initialData?.estimatedAmount ? String(initialData.estimatedAmount) : ""
  );
  const [hearingDate, setHearingDate] = useState(
    initialData?.hearingDate ? initialData.hearingDate.slice(0, 16) : ""
  );
  const [deadlineDate, setDeadlineDate] = useState(
    initialData?.deadlineDate ? initialData.deadlineDate.slice(0, 16) : ""
  );
  const [city, setCity] = useState(initialData?.city || "");
  const [courtName, setCourtName] = useState(initialData?.courtName || "");
  const [caseNumber, setCaseNumber] = useState(initialData?.caseNumber || "");

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        if (data.success) {
          setClients(data.data);
        }
      } catch {
        // Ignore
      }
    }
    loadClients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload = {
        title,
        description,
        discipline,
        complexity,
        priority,
        clientId: clientId || undefined,
        estimatedAmount: estimatedAmount ? Number(estimatedAmount) : undefined,
        hearingDate: hearingDate || undefined,
        deadlineDate: deadlineDate || undefined,
        city,
        courtName,
        caseNumber,
      };

      const url = isEditing ? `/api/cases/${caseId}` : "/api/cases";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Error al guardar el caso.");
        return;
      }

      if (isEditing) {
        router.push(`/crm/cases/${caseId}`);
      } else {
        router.push("/crm/cases");
      }
    } catch {
      setError("Error de conexion. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titulo del caso *</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Dictamen pericial de..."
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripcion</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripcion detallada del caso..."
          rows={4}
        />
      </div>

      {/* Discipline + Complexity + Priority */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Disciplina</Label>
          <Select value={discipline} onValueChange={setDiscipline}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CASE_DISCIPLINES.map((d) => (
                <SelectItem key={d} value={d}>{DISCIPLINE_LABELS[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Complejidad</Label>
          <Select value={complexity} onValueChange={setComplexity}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CASE_COMPLEXITIES.map((c) => (
                <SelectItem key={c} value={c}>{COMPLEXITY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Prioridad</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CASE_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client + Estimated Amount */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name} {c.company ? `(${c.company})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedAmount">Monto Estimado (COP)</Label>
          <Input
            id="estimatedAmount"
            type="number"
            value={estimatedAmount}
            onChange={(e) => setEstimatedAmount(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {/* City + Court */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Bogota"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="courtName">Juzgado</Label>
          <Input
            id="courtName"
            value={courtName}
            onChange={(e) => setCourtName(e.target.value)}
            placeholder="Juzgado 12 Civil del Circuito"
          />
        </div>
      </div>

      {/* Case Number + Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="caseNumber">Numero de Radicado</Label>
          <Input
            id="caseNumber"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="11001-31-03-012-2026-00001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hearingDate">Fecha de Audiencia</Label>
          <Input
            id="hearingDate"
            type="datetime-local"
            value={hearingDate}
            onChange={(e) => setHearingDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadlineDate">Fecha Limite</Label>
          <Input
            id="deadlineDate"
            type="datetime-local"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEditing ? "Guardando..." : "Creando..."
            : isEditing ? "Guardar Cambios" : "Crear Caso"}
        </Button>
      </div>
    </form>
  );
}
