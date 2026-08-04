"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Download, FileText, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Expert, ExpertAvailability } from "@/lib/types";

interface ProfilePayload {
  user: { displayName: string; email: string; phone?: string };
  expert: Expert;
}

export default function ExpertSelfProfileForm() {
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cv, setCv] = useState<File | null>(null);

  useEffect(() => {
    fetch("/api/expert/profile")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success) setData(payload.data);
        else setError(payload.error || "No fue posible cargar el perfil");
      })
      .catch(() => setError("No fue posible cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

  function updateUser(field: keyof ProfilePayload["user"], value: string) {
    setData((current) => current ? { ...current, user: { ...current.user, [field]: value } } : current);
  }

  function updateExpert(field: keyof Expert, value: string) {
    setData((current) => current ? { ...current, expert: { ...current.expert, [field]: value } } : current);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!data) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.set("displayName", data.user.displayName);
      form.set("email", data.user.email);
      form.set("phone", data.user.phone || "");
      form.set("city", data.expert.city || "");
      form.set("region", data.expert.region || "");
      form.set("availability", data.expert.availability);
      form.set("bankName", data.expert.bankName || "");
      form.set("bankAccountType", data.expert.bankAccountType || "");
      form.set("bankAccountNumber", data.expert.bankAccountNumber || "");
      form.set("bankAccountHolder", data.expert.bankAccountHolder || "");
      form.set("bankHolderDocument", data.expert.bankHolderDocument || "");
      if (cv) form.set("cv", cv);

      const response = await fetch("/api/expert/profile", { method: "PUT", body: form });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "No fue posible guardar");
      setData((current) => current ? { ...current, expert: payload.data } : current);
      setCv(null);
      setMessage(payload.message || "Perfil actualizado correctamente.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center rounded-xl border bg-white p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!data) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  const bankingComplete = Boolean(
    data.expert.bankName && data.expert.bankAccountType && data.expert.bankAccountNumber
    && data.expert.bankAccountHolder && data.expert.bankHolderDocument,
  );

  return (
    <form onSubmit={submit} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Datos profesionales y bancarios</h2>
          <p className="text-sm text-muted-foreground">Estos datos determinan tu disponibilidad para recibir casos y pagos.</p>
        </div>
        <Badge variant="outline" className={bankingComplete ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
          {bankingComplete ? "Cuenta completa" : "Cuenta incompleta"}
        </Badge>
      </div>

      {!bankingComplete && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          No podrás recibir casos hasta completar banco, tipo y número de cuenta, titular y documento del titular.
        </div>
      )}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="expert-name">Nombre</Label><Input id="expert-name" value={data.user.displayName} onChange={(e) => updateUser("displayName", e.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="expert-email">Correo</Label><Input id="expert-email" type="email" value={data.user.email} onChange={(e) => updateUser("email", e.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="expert-phone">Teléfono</Label><Input id="expert-phone" value={data.user.phone || ""} onChange={(e) => updateUser("phone", e.target.value)} /></div>
        <div className="space-y-2">
          <Label>Disponibilidad</Label>
          <Select value={data.expert.availability} onValueChange={(value) => updateExpert("availability", value as ExpertAvailability)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="ocupado">Ocupado</SelectItem>
              <SelectItem value="no_disponible">No disponible</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label htmlFor="expert-city">Ciudad</Label><Input id="expert-city" value={data.expert.city || ""} onChange={(e) => updateExpert("city", e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="expert-region">Departamento / región</Label><Input id="expert-region" value={data.expert.region || ""} onChange={(e) => updateExpert("region", e.target.value)} /></div>
      </div>

      <div className="border-t pt-5">
        <h3 className="mb-4 font-semibold">Cuenta para recibir pagos</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="self-bank">Banco</Label><Input id="self-bank" value={data.expert.bankName || ""} onChange={(e) => updateExpert("bankName", e.target.value)} required /></div>
          <div className="space-y-2">
            <Label>Tipo de cuenta</Label>
            <Select value={data.expert.bankAccountType || ""} onValueChange={(value) => updateExpert("bankAccountType", value)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent><SelectItem value="ahorros">Ahorros</SelectItem><SelectItem value="corriente">Corriente</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="self-account">Número de cuenta</Label><Input id="self-account" value={data.expert.bankAccountNumber || ""} onChange={(e) => updateExpert("bankAccountNumber", e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="self-holder">Titular</Label><Input id="self-holder" value={data.expert.bankAccountHolder || ""} onChange={(e) => updateExpert("bankAccountHolder", e.target.value)} required /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="self-holder-document">Documento del titular</Label><Input id="self-holder-document" value={data.expert.bankHolderDocument || ""} onChange={(e) => updateExpert("bankHolderDocument", e.target.value)} required /></div>
        </div>
      </div>

      <div className="border-t pt-5 space-y-3">
        <h3 className="font-semibold">Hoja de vida</h3>
        <p className="text-sm text-muted-foreground">Al reemplazarla, tu perfil volverá a “En evaluación” y el administrador deberá recategorizarlo.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Input className="max-w-md" type="file" accept=".pdf,.doc,.docx" onChange={(event) => setCv(event.target.files?.[0] || null)} />
          {data.expert.cvDownloadUrl && (
            <Button type="button" variant="outline" asChild>
              <a href={data.expert.cvDownloadUrl}><Download className="mr-2 h-4 w-4" />Ver hoja actual</a>
            </Button>
          )}
          {cv && <span className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3.5 w-3.5" />{cv.name}</span>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar perfil
        </Button>
      </div>
    </form>
  );
}
