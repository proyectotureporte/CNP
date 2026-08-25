"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Loader2, Search, UserCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CaseExpanded, CrmClient } from "@/lib/types";

export type QuickAssignmentMode = "expert" | "client";

interface ExpertOption {
  userId: string;
  displayName: string;
  specialization?: string;
  city?: string;
}

interface AssignmentOptions {
  internal: ExpertOption[];
  external: ExpertOption[];
}

interface CaseQuickAssignmentDialogProps {
  caseItem: CaseExpanded | null;
  mode: QuickAssignmentMode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

export function CaseQuickAssignmentDialog({
  caseItem,
  mode,
  open,
  onOpenChange,
  onAssigned,
}: CaseQuickAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [expertType, setExpertType] = useState<"internal" | "external">("external");
  const [expertOptions, setExpertOptions] = useState<AssignmentOptions>({ internal: [], external: [] });
  const [clients, setClients] = useState<CrmClient[]>([]);

  useEffect(() => {
    if (!open || !caseItem || !mode) return;

    const controller = new AbortController();
    const defaultExpertType = ["financiero", "contable"].includes(caseItem.discipline)
      ? "internal"
      : "external";
    setExpertType(defaultExpertType);
    setSelectedId("");
    setSearch("");
    setError("");
    setLoading(true);
    setExpertOptions({ internal: [], external: [] });
    setClients([]);

    const url = mode === "expert"
      ? `/api/cases/${caseItem._id}/assignment-options`
      : "/api/clients";

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) {
          throw new Error(body.error || "No se pudieron cargar las opciones disponibles.");
        }
        if (mode === "expert") setExpertOptions(body.data);
        else setClients(body.data);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(requestError instanceof Error ? requestError.message : "Error de conexión al cargar las opciones.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [caseItem, mode, open]);

  const visibleOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es");

    if (mode === "expert") {
      const options = expertOptions[expertType];
      if (!normalizedSearch) return options;
      return options.filter((option) => [option.displayName, option.specialization, option.city]
        .some((value) => value?.toLocaleLowerCase("es").includes(normalizedSearch)));
    }

    if (!normalizedSearch) return clients;
    return clients.filter((client) => [client.name, client.company, client.email]
      .some((value) => value?.toLocaleLowerCase("es").includes(normalizedSearch)));
  }, [clients, expertOptions, expertType, mode, search]);

  async function confirmAssignment() {
    if (!caseItem || !mode || !selectedId) return;

    setSaving(true);
    setError("");
    try {
      const response = mode === "expert"
        ? await fetch(`/api/cases/${caseItem._id}/assign`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: expertType === "external" ? "assignedExpert" : "assignedFinanciero",
              userId: selectedId,
            }),
          })
        : await fetch(`/api/cases/${caseItem._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId: selectedId }),
          });

      const body = await response.json();
      if (!response.ok || !body.success) {
        setError(body.error || `No se pudo asignar ${mode === "expert" ? "el perito" : "el cliente"}.`);
        return;
      }

      onOpenChange(false);
      onAssigned();
    } catch {
      setError("Error de conexión al guardar la asignación.");
    } finally {
      setSaving(false);
    }
  }

  const currentAssignment = mode === "expert"
    ? caseItem?.assignedExpert?.displayName || caseItem?.assignedFinanciero?.displayName
    : caseItem?.client?.name;
  const emptyLabel = mode === "expert"
    ? `No hay peritos ${expertType === "internal" ? "internos" : "externos habilitados"} disponibles para este caso.`
    : "No hay clientes que coincidan con la búsqueda.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[86vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "expert"
              ? <UserCheck className="size-5 text-emerald-600" />
              : <UserRound className="size-5 text-[#1b5697]" />}
            {mode === "expert" ? "Asignar a perito" : "Asignar a cliente"}
          </DialogTitle>
          <DialogDescription>
            {caseItem?.caseCode} · {caseItem?.title}
            {currentAssignment ? ` · Asignación actual: ${currentAssignment}` : " · Sin asignación actual"}
          </DialogDescription>
        </DialogHeader>

        {mode === "expert" && (
          <Select
            value={expertType}
            onValueChange={(value: "internal" | "external") => {
              setExpertType(value);
              setSelectedId("");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Perito interno</SelectItem>
              <SelectItem value="external">Perito externo</SelectItem>
            </SelectContent>
          </Select>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={mode === "expert" ? "Buscar perito..." : "Buscar cliente, empresa o email..."}
            className="pl-9"
          />
        </div>

        <div className="min-h-48 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Cargando opciones...
            </div>
          ) : error && visibleOptions.length === 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : visibleOptions.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center">
              <BriefcaseBusiness className="size-9 text-muted-foreground/35" />
              <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
            </div>
          ) : (
            <div className="space-y-2" role="radiogroup" aria-label="Opciones de asignación">
              {visibleOptions.map((option) => {
                const id = mode === "expert" ? (option as ExpertOption).userId : (option as CrmClient)._id;
                const title = mode === "expert" ? (option as ExpertOption).displayName : (option as CrmClient).name;
                const detail = mode === "expert"
                  ? [(option as ExpertOption).specialization, (option as ExpertOption).city].filter(Boolean).join(" · ")
                  : [(option as CrmClient).company, (option as CrmClient).email].filter(Boolean).join(" · ");
                const selected = selectedId === id;

                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSelectedId(id)}
                    className={`w-full cursor-pointer rounded-xl border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2969b0] ${
                      selected
                        ? "border-[#2969b0] bg-[#2969b0]/5"
                        : "border-border/70 bg-white hover:border-[#2969b0]/35 hover:bg-muted/30"
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{detail || "Sin información adicional"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && visibleOptions.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={confirmAssignment} disabled={!selectedId || loading || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saving ? "Asignando..." : "Confirmar asignación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
