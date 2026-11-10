"use client";

import { useCallback, useEffect, useState } from "react";
import { Scale, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Lawyer {
  _id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  active: boolean;
}

interface CaseLawyersCardProps {
  caseId: string;
  canEdit: boolean;
}

/** Abogados con acceso de supervisión al caso (visibilidad sin intervención). */
export default function CaseLawyersCard({ caseId, canEdit }: CaseLawyersCardProps) {
  const [assigned, setAssigned] = useState<Lawyer[]>([]);
  const [available, setAvailable] = useState<Lawyer[]>([]);
  const [selected, setSelected] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/lawyers`);
      const data = await res.json();
      if (data.success) {
        setAssigned(data.data.assigned || []);
        setAvailable(data.data.available || []);
      }
    } catch { /* ignore */ }
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  async function submit(body: Record<string, string>) {
    setWorking(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/cases/${caseId}/lawyers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "No fue posible autorizar al abogado");
      setAssigned(data.data.assigned || []);
      if (data.data.created) setNotice("Cuenta creada: el abogado recibió sus credenciales del portal por correo.");
      setSelected("");
      setShowNew(false);
      setName(""); setEmail(""); setPhone("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setWorking(false);
    }
  }

  async function remove(userId: string) {
    if (!window.confirm("¿Retirar el acceso de este abogado al caso?")) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/lawyers?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) setAssigned(data.data.assigned || []);
    } finally {
      setWorking(false);
    }
  }

  const selectable = available.filter((lawyer) => !assigned.some((item) => item._id === lawyer._id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4" />Abogados con acceso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          El abogado ve el seguimiento, los documentos autorizados y los entregables aprobados desde el portal, y puede aportar documentos.
          No ve peritos, cotizaciones ni pagos, ni se comunica con el perito.
        </p>
        {assigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ningún abogado autorizado todavía.</p>
        ) : (
          <ul className="space-y-1">
            {assigned.map((lawyer) => (
              <li key={lawyer._id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{lawyer.displayName}{!lawyer.active && <span className="ml-1 text-xs text-muted-foreground">(inactivo)</span>}</p>
                  {lawyer.email && <p className="truncate text-xs text-muted-foreground">{lawyer.email}</p>}
                </div>
                {canEdit && (
                  <Button variant="ghost" size="icon-xs" title="Retirar acceso" onClick={() => remove(lawyer._id)} disabled={working}><X /></Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <div className="space-y-2 border-t pt-3">
            {selectable.length > 0 && (
              <div className="flex gap-2">
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Abogado registrado..." /></SelectTrigger>
                  <SelectContent>
                    {selectable.map((lawyer) => (
                      <SelectItem key={lawyer._id} value={lawyer._id}>{lawyer.displayName}{lawyer.email ? ` · ${lawyer.email}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!selected || working} onClick={() => submit({ userId: selected })}>Autorizar</Button>
              </div>
            )}
            {showNew ? (
              <div className="space-y-2 rounded-md bg-muted/30 p-3">
                <div className="space-y-1"><Label htmlFor="lawyer-name">Nombre</Label><Input id="lawyer-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="lawyer-email">Correo</Label><Input id="lawyer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="lawyer-phone">Teléfono (opcional)</Label><Input id="lawyer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={working || !name.trim() || !email.trim()} onClick={() => submit({ displayName: name, email, phone })}>
                    {working ? "Creando..." : "Crear y autorizar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNew(false)} disabled={working}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowNew(true)} disabled={working}>
                <UserPlus className="mr-1 h-4 w-4" />Nuevo abogado (se le envían credenciales)
              </Button>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {notice && <p className="text-sm text-green-700">{notice}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
