"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import type { CrmClient } from "@/lib/types";

interface ClientTableProps {
  clients: CrmClient[];
  showActions?: boolean;
  onValidated?: () => void;
}

const statusConfig: Record<
  CrmClient["status"],
  { label: string; bgClass: string; textClass: string; dotClass: string }
> = {
  activo: {
    label: "Activo",
    bgClass: "bg-green-50",
    textClass: "text-green-700",
    dotClass: "bg-green-500",
  },
  inactivo: {
    label: "Inactivo",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
    dotClass: "bg-red-500",
  },
  prospecto: {
    label: "Prospecto",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    dotClass: "bg-amber-500",
  },
};

const peritusStatusConfig: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  pendiente: { label: "Pendiente", bgClass: "bg-amber-50", textClass: "text-amber-700" },
  revision: { label: "En Revisión", bgClass: "bg-blue-50", textClass: "text-blue-700" },
  aprobado: { label: "Aprobado", bgClass: "bg-green-50", textClass: "text-green-700" },
  denegado: { label: "Denegado", bgClass: "bg-red-50", textClass: "text-red-700" },
};

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("es-CO");
  } catch {
    return dateString;
  }
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function EmptyUsersIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-auto text-gray-300"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function ClientTable({
  clients,
  showActions = true,
  onValidated,
}: ClientTableProps) {
  const { user } = useAuth();
  const canValidate = user && ["admin", "juridico"].includes(user.role);

  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleValidate(clientId: string, action: "aprobado" | "denegado", notes?: string) {
    setActionLoading(clientId + action);
    try {
      const res = await fetch(`/api/clients/${clientId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes || "" }),
      });
      const data = await res.json();
      if (data.success) {
        setRejectTarget(null);
        setRejectNotes("");
        onValidated?.();
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
        <EmptyUsersIcon />
        <h3 className="mt-4 text-sm font-semibold text-gray-500">
          No hay clientes
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          Los clientes que agregues apareceran aqui
        </p>
      </div>
    );
  }

  const thClass =
    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500";

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div>
          <table className="w-full table-fixed">
            <thead className="bg-gray-50/80">
              <tr>
                <th scope="col" className={thClass}>
                  Nombre
                </th>
                <th scope="col" className={thClass}>
                  Email
                </th>
                <th scope="col" className={thClass}>
                  Empresa
                </th>
                <th scope="col" className={thClass}>
                  Estado
                </th>
                <th scope="col" className={thClass}>
                  Fecha
                </th>
                {showActions && (
                  <th scope="col" className={thClass}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const status = statusConfig[client.status];
                const isPeritus = client.brand === "Peritus";
                const peritusStatus = client.peritusRegistro?.estadoDocumentacion;
                const showValidateButtons =
                  canValidate &&
                  isPeritus &&
                  (peritusStatus === "pendiente" || peritusStatus === "revision");

                return (
                  <tr
                    key={client._id}
                    className="border-b border-gray-50 transition-all duration-200 hover:bg-gray-50/50"
                  >
                    {/* Nombre + badges debajo */}
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="truncate">{client.name}</span>
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              isPeritus
                                ? "bg-violet-100 text-violet-700"
                                : "bg-sky-100 text-sky-700"
                            }`}
                          >
                            {client.brand || "CNP"}
                          </span>
                          {isPeritus && peritusStatus && peritusStatus !== "aprobado" && (
                            <span
                              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                peritusStatusConfig[peritusStatus]?.bgClass || "bg-gray-100"
                              } ${peritusStatusConfig[peritusStatus]?.textClass || "text-gray-700"}`}
                            >
                              {peritusStatusConfig[peritusStatus]?.label || peritusStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="truncate px-4 py-3.5 text-sm text-gray-600">
                      {client.email}
                    </td>
                    <td className="truncate px-4 py-3.5 text-sm text-gray-600">
                      {client.company}
                    </td>
                    <td className="truncate px-4 py-3.5 text-sm">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bgClass} ${status.textClass}`}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                        />
                        {status.label}
                      </span>
                    </td>
                    <td className="truncate px-4 py-3.5 text-sm text-gray-500">
                      {formatDate(client._createdAt)}
                    </td>
                    {showActions && (
                      <td className="px-4 py-3.5 text-sm text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <Link
                            href={`/crm/clients/${client._id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium text-[#2969b0] transition-all duration-200 hover:bg-[#2969b0]/5"
                          >
                            <EyeIcon />
                            Ver
                          </Link>
                          <Link
                            href={`/crm/clients/${client._id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium text-[#2969b0] transition-all duration-200 hover:bg-[#2969b0]/5"
                          >
                            <PencilIcon />
                            Editar
                          </Link>
                          {/* Botones de validación Peritus */}
                          {showValidateButtons && (
                            <>
                              <button
                                onClick={() => handleValidate(client._id, "aprobado")}
                                disabled={actionLoading !== null}
                                title="Aprobar"
                                className="inline-flex items-center justify-center rounded-lg bg-green-50 p-2 text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                              >
                                {actionLoading === client._id + "aprobado" ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => setRejectTarget({ id: client._id, name: client.name })}
                                disabled={actionLoading !== null}
                                title="Denegar"
                                className="inline-flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de rechazo */}
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denegar Cliente Peritus</DialogTitle>
            <DialogDescription>
              Indique la razon por la cual se deniega a {rejectTarget?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectNotesTable">Notas de rechazo *</Label>
            <Textarea
              id="rejectNotesTable"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Explique la razon del rechazo..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectNotes("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectTarget && handleValidate(rejectTarget.id, "denegado", rejectNotes)
              }
              disabled={!rejectNotes.trim() || actionLoading !== null}
            >
              {actionLoading !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirmar Denegación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
