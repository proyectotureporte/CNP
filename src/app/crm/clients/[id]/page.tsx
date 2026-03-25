"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, XCircle, Loader2, FileText, Download,
  MapPin, Briefcase, User, Phone, Mail,
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
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import type { CrmClient } from "@/lib/types";
import {
  PERITUS_DOC_STATUS_LABELS,
  PERITUS_DOC_STATUS_COLORS,
  type PeritusDocStatus,
} from "@/lib/types";

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
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const canValidate = user && ["admin", "juridico"].includes(user.role);
  const isPeritus = client?.brand === "Peritus";
  const peritusRegistro = client?.peritusRegistro;
  const peritusStatus = peritusRegistro?.estadoDocumentacion;
  const valColor = peritusStatus
    ? PERITUS_DOC_STATUS_COLORS[peritusStatus as PeritusDocStatus]
    : null;

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

  async function handleDelete() {
    const confirmed = window.confirm(
      "Esta seguro de que desea eliminar este cliente? Esta accion no se puede deshacer."
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Error al eliminar el cliente.");
        setDeleting(false);
        return;
      }

      router.push("/crm/clients");
    } catch {
      setError("Error de conexion. Intente nuevamente.");
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

      {client && (
        <>
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              {/* Marca */}
              <Badge
                className={`border-0 text-xs ${
                  isPeritus
                    ? "bg-violet-100 text-violet-700"
                    : "bg-sky-100 text-sky-700"
                }`}
              >
                {client.brand || "CNP"}
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
              {canValidate && isPeritus && (peritusStatus === "pendiente" || peritusStatus === "revision") && (
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
              <Link
                href={`/crm/clients/${id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2969b0] focus:ring-offset-2"
                style={{ background: "linear-gradient(135deg, #2969b0, #1b5697)" }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                Editar
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
              <Link
                href="/crm/clients"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2969b0] focus:ring-offset-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                Volver
              </Link>
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
            <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <User className="h-3.5 w-3.5" />
                  Nombre
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{client.name}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{client.email || "-"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <Phone className="h-3.5 w-3.5" />
                  Telefono
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{client.phone || "-"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                  Empresa
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{client.company || "-"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <Briefcase className="h-3.5 w-3.5" />
                  Cargo
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{client.position || "-"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  Estado
                </dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[client.status] || "bg-gray-100 text-gray-800"}`}>
                    {statusLabels[client.status] || client.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  Creado por
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{client.createdBy || "-"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  Fecha de creacion
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(client._createdAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <FileText className="h-3.5 w-3.5" />
                  Notas
                </dt>
                <dd className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-900">
                  {client.notes || "Sin notas."}
                </dd>
              </div>
            </dl>
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
