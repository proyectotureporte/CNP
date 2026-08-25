"use client";

import { use, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, Loader2, FileText, Download,
  MapPin, Briefcase, User, Phone, Mail, Pencil, Trash2,
  ArrowLeft, Save, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionPillButton } from "@/components/ui/action-pill-button";
import { useAuth } from "@/hooks/useAuth";
import { canManageClients } from "@/lib/auth/permissions";
import type { CrmClient, UserRole } from "@/lib/types";
import {
  CLIENT_TYPE_LABELS,
  PERITUS_DOC_STATUS_LABELS,
  PERITUS_DOC_STATUS_COLORS,
  type PeritusDocStatus,
} from "@/lib/types";

interface ClientEditForm {
  brand: 'CNP' | 'Peritus';
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: CrmClient['status'];
  clientType: NonNullable<CrmClient['clientType']>;
  notes: string;
}

function clientToEditForm(client: CrmClient): ClientEditForm {
  return {
    brand: client.brand || 'CNP',
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    company: client.company || '',
    position: client.position || '',
    status: client.status || 'prospecto',
    clientType: client.clientType || 'persona_natural',
    notes: client.notes || '',
  };
}

const inlineFieldClass = 'mt-2 h-10 rounded-lg border-gray-200 bg-white shadow-sm focus-visible:border-[#2969b0] focus-visible:ring-[#2969b0]/20';

const statusLabels: Record<CrmClient["status"], string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  prospecto: "Prospecto",
};

const statusStyles: Record<CrmClient["status"], string> = {
  activo: "bg-green-50 text-green-700 ring-1 ring-green-600/20",
  inactivo: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
  prospecto: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
};

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-48 rounded bg-gray-200" />
          <div className="h-6 w-20 rounded-full bg-gray-100" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
          <div className="h-10 w-24 rounded-lg bg-gray-100" />
          <div className="h-10 w-24 rounded-lg bg-gray-100" />
        </div>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-2.5 w-20 rounded bg-gray-200" />
              <div className="h-4 w-36 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CrmClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [client, setClient] = useState<CrmClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ClientEditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const canManage = !!user && canManageClients(user.role as UserRole, user.allRoles);
  const canValidate = canManage;
  const isPeritus = client?.brand === "Peritus";
  const peritusRegistro = client?.peritusRegistro;
  const peritusStatus = peritusRegistro?.estadoDocumentacion;
  const valColor = peritusStatus
    ? PERITUS_DOC_STATUS_COLORS[peritusStatus as PeritusDocStatus]
    : null;
  const displayedName = isEditing ? editForm?.name || "Cliente sin nombre" : client?.name;
  const displayedBrand = isEditing ? editForm?.brand || "CNP" : client?.brand || "CNP";

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, clientRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/clients/${id}`),
        ]);

        if (!meRes.ok) {
          router.push("/crm/login");
          return;
        }

        const meData = await meRes.json();
        if (!meData.success) {
          router.push("/crm/login");
          return;
        }

        const clientData = await clientRes.json();
        if (!clientData.success) {
          setError(clientData.error || "Cliente no encontrado.");
          return;
        }

        setClient(clientData.data);
        setEditForm(clientToEditForm(clientData.data));
      } catch {
        setError("Error al cargar los datos del cliente.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, router]);

  async function handleValidate(action: "aprobado" | "denegado", notes?: string) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes || "" }),
      });
      const data = await res.json();
      if (data.success) {
        setClient((prev) =>
          prev
            ? {
                ...prev,
                peritusRegistro: prev.peritusRegistro
                  ? { ...prev.peritusRegistro, estadoDocumentacion: action as PeritusDocStatus }
                  : prev.peritusRegistro,
              }
            : null
        );
        setShowRejectDialog(false);
        setRejectNotes("");
      } else {
        setError(data.error || "Error al validar");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setActionLoading(false);
    }
  }

  function startEditing() {
    if (!client) return;
    setEditForm(clientToEditForm(client));
    setSavedNotice("");
    setError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    if (client) setEditForm(clientToEditForm(client));
    setError("");
    setIsEditing(false);
  }

  function handleEditChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setEditForm((current) => current ? { ...current, [name]: value } as ClientEditForm : current);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editForm) return;

    setSaving(true);
    setError("");
    setSavedNotice("");

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Error al actualizar el cliente.");
        return;
      }

      setClient(data.data);
      setEditForm(clientToEditForm(data.data));
      setIsEditing(false);
      setSavedNotice("Cambios guardados correctamente.");
    } catch {
      setError("Error de conexion. Intente nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Error al eliminar el cliente.");
        setDeleting(false);
        return;
      }

      setShowDeleteDialog(false);
      router.push("/crm/clients");
    } catch {
      setDeleteError("Error de conexion. Intente nuevamente.");
      setDeleting(false);
    }
  }

  function formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  return (
    <>
      {loading && <DetailSkeleton />}

      {error && (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4"
          role="alert"
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {savedNotice && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700" role="status">
          <CheckCircle className="size-5 shrink-0" />
          {savedNotice}
        </div>
      )}

      {client && (
        <>
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{displayedName}</h1>
              {/* Marca */}
              <Badge
                className={`border-0 text-xs ${
                  displayedBrand === "Peritus"
                    ? "bg-violet-100 text-violet-700"
                    : "bg-sky-100 text-sky-700"
                }`}
              >
                {displayedBrand}
              </Badge>
              {/* Estado cliente */}
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  statusStyles[client.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {statusLabels[client.status] || client.status}
              </span>
              {/* Estado Peritus */}
              {isPeritus && peritusStatus && (
                <Badge
                  className={`border-0 ${valColor?.bg || ""} ${valColor?.text || ""}`}
                >
                  {PERITUS_DOC_STATUS_LABELS[peritusStatus as PeritusDocStatus] || peritusStatus}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Botones aprobar/denegar para Peritus pendiente */}
              {!isEditing && canValidate && isPeritus && (peritusStatus === "pendiente" || peritusStatus === "revision") && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={actionLoading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Denegar
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
              {canManage && (
                <>
                  {!isEditing && (
                    <ActionPillButton
                      type="button"
                      label="Editar"
                      tone="blue"
                      icon={<Pencil className="size-4" />}
                      onClick={startEditing}
                    />
                  )}
                  <ActionPillButton
                    type="button"
                    label={deleting ? "Eliminando..." : "Eliminar"}
                    tone="red"
                    icon={deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleting}
                  />
                </>
              )}
              <ActionPillButton
                type="button"
                label="Volver"
                tone="slate"
                icon={<ArrowLeft className="size-4" />}
                onClick={() => router.push("/crm/clients")}
              />
            </div>
          </div>

          {/* Banner de bloqueo si Peritus no aprobado */}
          {isPeritus && peritusStatus && peritusStatus !== "aprobado" && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-amber-700">
                No se pueden crear casos a nombre de este cliente hasta que sea aprobado.
              </p>
            </div>
          )}

          {/* Datos básicos del cliente */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm mb-6">
            {isEditing && editForm ? (
              <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="client-name" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <User className="size-3.5" /> Nombre
                    </Label>
                    <Input id="client-name" name="name" value={editForm.name} onChange={handleEditChange} className={inlineFieldClass} />
                  </div>
                  <div>
                    <Label htmlFor="client-email" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <Mail className="size-3.5" /> Email
                    </Label>
                    <Input id="client-email" name="email" type="email" value={editForm.email} onChange={handleEditChange} className={inlineFieldClass} />
                  </div>
                  <div>
                    <Label htmlFor="client-phone" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <Phone className="size-3.5" /> Telefono
                    </Label>
                    <Input id="client-phone" name="phone" value={editForm.phone} onChange={handleEditChange} className={inlineFieldClass} />
                  </div>
                  <div>
                    <Label htmlFor="client-company" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <Briefcase className="size-3.5" /> Empresa
                    </Label>
                    <Input id="client-company" name="company" value={editForm.company} onChange={handleEditChange} className={inlineFieldClass} />
                  </div>
                  <div>
                    <Label htmlFor="client-position" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cargo</Label>
                    <Input id="client-position" name="position" value={editForm.position} onChange={handleEditChange} className={inlineFieldClass} />
                  </div>
                  <div>
                    <Label htmlFor="client-brand" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Marca (CNP o Peritus)</Label>
                    <select id="client-brand" name="brand" value={editForm.brand} onChange={handleEditChange} className={`${inlineFieldClass} w-full px-3 text-sm outline-none`}>
                      <option value="CNP">CNP</option>
                      <option value="Peritus">Peritus</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="client-type" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo de cliente</Label>
                    <select id="client-type" name="clientType" value={editForm.clientType} onChange={handleEditChange} className={`${inlineFieldClass} w-full px-3 text-sm outline-none`}>
                      {Object.entries(CLIENT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="client-status" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</Label>
                    <select id="client-status" name="status" value={editForm.status} onChange={handleEditChange} className={`${inlineFieldClass} w-full px-3 text-sm outline-none`}>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="client-notes" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <FileText className="size-3.5" /> Notas
                    </Label>
                    <Textarea id="client-notes" name="notes" value={editForm.notes} onChange={handleEditChange} rows={4} className="mt-2 rounded-lg border-gray-200 bg-white shadow-sm focus-visible:border-[#2969b0] focus-visible:ring-[#2969b0]/20" />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
                  <ActionPillButton
                    type="submit"
                    label={saving ? "Guardando..." : "Guardar"}
                    tone="green"
                    icon={saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    disabled={saving}
                  />
                  <ActionPillButton
                    type="button"
                    label="Cancelar"
                    tone="red"
                    icon={<XCircle className="size-4" />}
                    onClick={cancelEditing}
                    disabled={saving}
                  />
                  <p className="text-xs text-gray-500">Los campos de texto pueden guardarse vacios.</p>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <div><dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"><User className="size-3.5" />Nombre</dt><dd className="mt-1 text-sm text-gray-900">{client.name || "-"}</dd></div>
                <div><dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"><Mail className="size-3.5" />Email</dt><dd className="mt-1 text-sm text-gray-900">{client.email || "-"}</dd></div>
                <div><dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"><Phone className="size-3.5" />Telefono</dt><dd className="mt-1 text-sm text-gray-900">{client.phone || "-"}</dd></div>
                <div><dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"><Briefcase className="size-3.5" />Empresa</dt><dd className="mt-1 text-sm text-gray-900">{client.company || "-"}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cargo</dt><dd className="mt-1 text-sm text-gray-900">{client.position || "-"}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Marca (CNP o Peritus)</dt><dd className="mt-1 text-sm text-gray-900">{client.brand || "CNP"}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tipo de cliente</dt><dd className="mt-1 text-sm text-gray-900">{client.clientType ? CLIENT_TYPE_LABELS[client.clientType] : "-"}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Estado</dt><dd className="mt-1"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[client.status] || "bg-gray-100 text-gray-800"}`}>{statusLabels[client.status] || client.status}</span></dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Creado por</dt><dd className="mt-1 text-sm text-gray-900">{client.createdBy || "-"}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fecha de creacion</dt><dd className="mt-1 text-sm text-gray-900">{formatDate(client._createdAt)}</dd></div>
                <div className="sm:col-span-2"><dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"><FileText className="size-3.5" />Notas</dt><dd className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-900">{client.notes || "Sin notas."}</dd></div>
              </dl>
            )}
          </div>

          {/* Panel Peritus (solo si tiene registroPeritus) */}
          {isPeritus && peritusRegistro && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Datos del registro */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">P</span>
                    Perfil Peritus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {peritusRegistro.peritusId && (
                    <div>
                      <p className="text-xs text-muted-foreground">ID Peritus</p>
                      <p className="text-sm font-mono font-medium">{peritusRegistro.peritusId}</p>
                    </div>
                  )}
                  {peritusRegistro.cedula && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>CC {peritusRegistro.cedula}</span>
                    </div>
                  )}
                  {peritusRegistro.ciudad && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{peritusRegistro.ciudad}</span>
                    </div>
                  )}
                  {peritusRegistro.correo && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{peritusRegistro.correo}</span>
                    </div>
                  )}
                  {peritusRegistro.celular && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{peritusRegistro.celular}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Profesion</p>
                      <p className="text-sm font-medium">{peritusRegistro.profesionOficio || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cargo</p>
                      <p className="text-sm font-medium">{peritusRegistro.cargo || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Experiencia</p>
                      <p className="text-sm font-medium">{peritusRegistro.experiencia ? `${peritusRegistro.experiencia} años` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Edad</p>
                      <p className="text-sm font-medium">{peritusRegistro.edad ? `${peritusRegistro.edad} años` : "-"}</p>
                    </div>
                  </div>
                  {peritusRegistro.especialidad && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground">Especialidad</p>
                        <p className="text-sm">{peritusRegistro.especialidad}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Hoja de vida + estado */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentacion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Estado validacion */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Estado de validacion</p>
                    {peritusStatus ? (
                      <Badge className={`border-0 ${valColor?.bg || ""} ${valColor?.text || ""}`}>
                        <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${valColor?.dot || ""}`} />
                        {PERITUS_DOC_STATUS_LABELS[peritusStatus as PeritusDocStatus]}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Hoja de vida */}
                  {peritusRegistro.hojaDeVidaUrl ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Hoja de Vida</p>
                      <a
                        href={peritusRegistro.hojaDeVidaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100"
                      >
                        <Download className="h-4 w-4" />
                        Descargar Hoja de Vida
                      </a>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Hoja de Vida</p>
                      <p className="text-sm text-muted-foreground">No adjuntada</p>
                    </div>
                  )}

                  {/* Fecha de registro */}
                  {peritusRegistro.fechaRegistro && (
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de registro</p>
                      <p className="text-sm">{formatDate(peritusRegistro.fechaRegistro)}</p>
                    </div>
                  )}

                  {/* Notas de validacion */}
                  {peritusRegistro.notasValidacion && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notas de validacion</p>
                      <p className="text-sm rounded-lg bg-gray-50 p-3">{peritusRegistro.notasValidacion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeletePassword("");
            setDeleteError("");
            setShowDeletePassword(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cliente</DialogTitle>
            <DialogDescription>
              Esta accion es permanente. Escriba la contraseña de eliminación para continuar con {client?.name || "este cliente"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-password">Contraseña de eliminación</Label>
            <div className="relative">
              <Input
                id="delete-password"
                type={showDeletePassword ? "text" : "password"}
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && deletePassword && !deleting) handleDelete();
                }}
                autoComplete="off"
                autoFocus
                className="pr-10"
                aria-invalid={Boolean(deleteError)}
              />
              <button
                type="button"
                aria-label={showDeletePassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowDeletePassword((current) => !current)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-red-500"
              >
                {showDeletePassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {deleteError && <p className="text-sm font-medium text-red-600" role="alert">{deleteError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Conservar cliente
            </Button>
            <ActionPillButton
              type="button"
              label={deleting ? "Eliminando..." : "Eliminar"}
              tone="red"
              icon={deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              onClick={handleDelete}
              disabled={!deletePassword || deleting}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de rechazo/denegacion */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denegar Cliente Peritus</DialogTitle>
            <DialogDescription>
              Indique la razon por la cual se deniega al cliente {client?.name}.
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
              onClick={() => handleValidate("denegado", rejectNotes)}
              disabled={!rejectNotes.trim() || actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirmar Denegacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
