"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight, ChevronLeft, Save, Loader2, Check,
  User, BookOpen, CreditCard as CreditCardIcon,
} from "lucide-react";
import {
  CASE_DISCIPLINES, DISCIPLINE_LABELS,
  type Expert, type CaseDiscipline,
} from "@/lib/types";

interface ExpertFormProps {
  initialData?: Expert;
  expertId?: string;
}

interface UserOption {
  _id: string;
  displayName: string;
  email: string;
}

const STEPS = [
  { id: 1, label: "Datos Personales", icon: User },
  { id: 2, label: "Especialidades", icon: BookOpen },
  { id: 3, label: "Datos Bancarios", icon: CreditCardIcon },
];

export default function ExpertForm({ initialData, expertId }: ExpertFormProps) {
  const router = useRouter();
  const isEditing = !!expertId;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Datos personales
  const [userRef, setUserRef] = useState(initialData?.user?._id || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [region, setRegion] = useState(initialData?.region || "");
  const [taxId, setTaxId] = useState(initialData?.taxId || "");
  const [professionalCard, setProfessionalCard] = useState(initialData?.professionalCard || "");

  // Step 2: Especialidades
  const [disciplines, setDisciplines] = useState<string[]>(initialData?.disciplines || []);
  const [specialization, setSpecialization] = useState(initialData?.specialization || "");
  const [experienceYears, setExperienceYears] = useState(
    initialData?.experienceYears ? String(initialData.experienceYears) : ""
  );
  const [baseFee, setBaseFee] = useState(
    initialData?.baseFee ? String(initialData.baseFee) : ""
  );

  // Step 3: Datos bancarios
  const [bankName, setBankName] = useState(initialData?.bankName || "");
  const [bankAccountType, setBankAccountType] = useState(initialData?.bankAccountType || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(initialData?.bankAccountNumber || "");

  // Users for select
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (data.success) {
          const peritoUsers = data.data.filter(
            (u: { role: string; active: boolean }) => u.role === "perito" && u.active
          );
          setUsers(peritoUsers);
        }
      } catch { /* ignore */ }
    }
    if (!isEditing) loadUsers();
  }, [isEditing]);

  function toggleDiscipline(d: string) {
    setDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function validateStep(s: number): boolean {
    if (s === 1) {
      if (!isEditing && !userRef) {
        setError("Seleccione un usuario");
        return false;
      }
      return true;
    }
    if (s === 2) {
      if (disciplines.length === 0) {
        setError("Seleccione al menos una disciplina");
        return false;
      }
      return true;
    }
    return true;
  }

  function handleNext() {
    setError("");
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 3));
    }
  }

  function handlePrev() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    setError("");
    if (!validateStep(1) || !validateStep(2)) return;

    setSaving(true);
    try {
      const payload = {
        userRef: userRef || undefined,
        disciplines,
        specialization,
        experienceYears: parseInt(experienceYears) || 0,
        professionalCard,
        city,
        region,
        baseFee: parseFloat(baseFee) || 0,
        taxId,
        bankName,
        bankAccountType,
        bankAccountNumber,
      };

      const url = isEditing ? `/api/experts/${expertId}` : "/api/experts";
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/crm/experts");
        router.refresh();
      } else {
        setError(data.error || "Error al guardar");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { if (isDone) setStep(s.id); }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-primary/10 text-primary cursor-pointer"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Datos Personales */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="userRef">Usuario del Sistema *</Label>
                <Select value={userRef} onValueChange={setUserRef}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario perito..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.displayName} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Solo usuarios con rol &quot;perito&quot; aparecen aqui
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxId">NIT / Cedula</Label>
                <Input
                  id="taxId"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalCard">Tarjeta Profesional</Label>
                <Input
                  id="professionalCard"
                  value={professionalCard}
                  onChange={(e) => setProfessionalCard(e.target.value)}
                  placeholder="TP-12345"
                />
              </div>
            </div>

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
                <Label htmlFor="region">Region / Departamento</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Cundinamarca"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Especialidades */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Especialidades y Experiencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Disciplinas *</Label>
              <div className="flex flex-wrap gap-2">
                {CASE_DISCIPLINES.map((d) => (
                  <Badge
                    key={d}
                    variant={disciplines.includes(d) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleDiscipline(d)}
                  >
                    {disciplines.includes(d) && <Check className="mr-1 h-3 w-3" />}
                    {DISCIPLINE_LABELS[d as CaseDiscipline]}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Seleccione todas las disciplinas aplicables
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="specialization">Especializacion</Label>
              <Input
                id="specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Ej: Contabilidad forense, Valuacion inmobiliaria..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="experienceYears">Anos de Experiencia</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseFee">Tarifa Base (COP)</Label>
                <Input
                  id="baseFee"
                  type="number"
                  min="0"
                  step="10000"
                  value={baseFee}
                  onChange={(e) => setBaseFee(e.target.value)}
                  placeholder="150000"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Datos Bancarios */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos Bancarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Banco</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bancolombia, Davivienda, etc."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bankAccountType">Tipo de Cuenta</Label>
                <Select value={bankAccountType} onValueChange={setBankAccountType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ahorros">Ahorros</SelectItem>
                    <SelectItem value="corriente">Corriente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Numero de Cuenta</Label>
                <Input
                  id="bankAccountNumber"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="0000-0000-0000"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Los datos bancarios son necesarios para el pago de comisiones.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={step === 1 ? () => router.push("/crm/experts") : handlePrev}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {step === 1 ? "Cancelar" : "Anterior"}
        </Button>

        {step < 3 ? (
          <Button type="button" onClick={handleNext}>
            Siguiente
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Actualizar Perito" : "Registrar Perito"}
          </Button>
        )}
      </div>
    </div>
  );
}
