"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check, Building2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CASE_DISCIPLINES,
  DISCIPLINE_LABELS,
  CASE_COMPLEXITIES,
  COMPLEXITY_LABELS,
  CASE_PRIORITIES,
  PRIORITY_LABELS,
  type CaseExpanded,
} from "@/lib/types";
import { COLOMBIA_CITIES } from "@/lib/colombia-cities";

interface ClientOption {
  _id: string;
  name: string;
  company: string;
  brand: "CNP" | "Peritus";
  peritusRegistro?: { estadoDocumentacion?: string };
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
  const [clientOpen, setClientOpen] = useState(false);
  const [estimatedAmount, setEstimatedAmount] = useState(
    initialData?.estimatedAmount ? String(initialData.estimatedAmount) : ""
  );
  const [hasHearing, setHasHearing] = useState(initialData?.hasHearing || false);
  const [hearingDate, setHearingDate] = useState(
    initialData?.hearingDate ? initialData.hearingDate.slice(0, 16) : ""
  );
  const [hearingLink, setHearingLink] = useState(initialData?.hearingLink || "");
  const [deadlineDate, setDeadlineDate] = useState(
    initialData?.deadlineDate ? initialData.deadlineDate.slice(0, 16) : ""
  );
  const [city, setCity] = useState(initialData?.city || "");
  const [cityOpen, setCityOpen] = useState(false);
  const [hasCourtCase, setHasCourtCase] = useState(initialData?.courtName ? true : false);
  const [courtName, setCourtName] = useState(initialData?.courtName || "");
  const [caseNumber, setCaseNumber] = useState(initialData?.caseNumber || "");

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Derive selected client brand
  const selectedClient = clients.find((c) => c._id === clientId);
  const selectedBrand = clientId
    ? (selectedClient?.brand || "CNP")
    : (isEditing ? (initialData?.brand || "CNP") : null);

  useEffect(() => {
    if (initialData?.hasHearing) {
      setHasHearing(true);
    }
  }, [initialData]);

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
        hasHearing,
        hearingDate: hasHearing && hearingDate ? hearingDate : '',
        hearingLink: hasHearing && hearingLink ? hearingLink : '',
        deadlineDate: deadlineDate || undefined,
        city,
        courtName: hasCourtCase ? courtName : '',
        caseNumber: hasCourtCase ? caseNumber : '',
        brand: selectedBrand || 'CNP',
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

      {/* Client Selector - Always first */}
      <div className="space-y-2">
        <Label>Cliente *</Label>
        <Popover open={clientOpen} onOpenChange={setClientOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={clientOpen}
              className="w-full justify-between font-normal"
            >
              {selectedClient ? (
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {selectedClient.name}
                  {selectedClient.company ? ` (${selectedClient.company})` : ""}
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-1 text-xs border-0",
                      selectedClient.brand === "Peritus"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-sky-100 text-sky-700"
                    )}
                  >
                    {selectedClient.brand || "CNP"}
                  </Badge>
                </span>
              ) : (
                "Seleccionar cliente..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar cliente por nombre o empresa..." />
              <CommandList>
                <CommandEmpty>No se encontraron clientes</CommandEmpty>
                <CommandGroup>
                  {clients.map((c) => {
                    const isPeritusPending =
                      c.brand === "Peritus" &&
                      c.peritusRegistro?.estadoDocumentacion !== "aprobado";
                    return (
                      <CommandItem
                        key={c._id}
                        value={`${c.name} ${c.company || ""}`}
                        disabled={isPeritusPending}
                        onSelect={() => {
                          if (isPeritusPending) return;
                          setClientId(c._id === clientId ? "" : c._id);
                          setClientOpen(false);
                        }}
                        className={isPeritusPending ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            clientId === c._id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="flex items-center gap-2 flex-1">
                          {c.name}
                          {c.company ? (
                            <span className="text-muted-foreground text-xs">({c.company})</span>
                          ) : null}
                          <Badge
                            variant="outline"
                            className={cn(
                              "ml-1 text-xs border-0",
                              c.brand === "Peritus"
                                ? "bg-violet-100 text-violet-700"
                                : "bg-sky-100 text-sky-700"
                            )}
                          >
                            {c.brand || "CNP"}
                          </Badge>
                          {isPeritusPending && (
                            <Badge
                              variant="outline"
                              className="ml-auto text-xs border-0 bg-amber-100 text-amber-700"
                            >
                              Pendiente aprobacion
                            </Badge>
                          )}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* If no client selected yet and not editing, show hint */}
      {!isEditing && !clientId && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-center justify-center">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Selecciona un cliente para continuar con la creacion del caso.
          </p>
        </div>
      )}

      {/* Form - show when client is selected or when editing */}
      {(selectedBrand !== null || isEditing) && (clientId || isEditing) && (
        <>
          {/* Brand indicator */}
          {!isEditing && selectedBrand === "Peritus" && (
            <div className="flex items-center gap-2 rounded-lg bg-violet-50 border border-violet-200 px-4 py-2">
              <Badge className="bg-violet-600 text-white text-xs">Peritus</Badge>
              <span className="text-sm text-violet-700">Caso para Peritus</span>
            </div>
          )}
          {!isEditing && selectedBrand === "CNP" && (
            <div className="flex items-center gap-2 rounded-lg bg-sky-50 border border-sky-200 px-4 py-2">
              <Badge className="bg-sky-600 text-white text-xs">CNP</Badge>
              <span className="text-sm text-sky-700">Caso para Centro Nacional de Pruebas</span>
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

          {/* Estimated Amount */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          {/* City */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={cityOpen}
                    className="w-full justify-between font-normal"
                  >
                    {city || "Seleccionar ciudad..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar ciudad..." />
                    <CommandList>
                      <CommandEmpty>No encontrada</CommandEmpty>
                      <CommandGroup>
                        {COLOMBIA_CITIES.map((c) => (
                          <CommandItem
                            key={c}
                            value={c}
                            onSelect={(val) => {
                              setCity(val === city ? "" : val);
                              setCityOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                city === c ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {c}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Court Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasCourtCase"
                checked={hasCourtCase}
                onCheckedChange={(checked) => setHasCourtCase(checked === true)}
              />
              <Label htmlFor="hasCourtCase" className="text-sm font-medium cursor-pointer">
                Ira a Juzgado?
              </Label>
            </div>

            {hasCourtCase && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="courtName">Juzgado</Label>
                  <Input
                    id="courtName"
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    placeholder="Juzgado 12 Civil del Circuito"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caseNumber">Numero de Radicado</Label>
                  <Input
                    id="caseNumber"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="11001-31-03-012-2026-00001"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hearing Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasHearing"
                checked={hasHearing}
                onCheckedChange={(checked) => setHasHearing(checked === true)}
              />
              <Label htmlFor="hasHearing" className="text-sm font-medium cursor-pointer">
                Tendra audiencia?
              </Label>
            </div>

            {hasHearing && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="hearingLink">Enlace de Audiencia</Label>
                  <Input
                    id="hearingLink"
                    type="url"
                    value={hearingLink}
                    onChange={(e) => setHearingLink(e.target.value)}
                    placeholder="https://teams.microsoft.com/..."
                  />
                </div>
              </div>
            )}
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
        </>
      )}
    </form>
  );
}
