"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Check, Copy, Pencil, UserRound } from "lucide-react";
import { ActionPillButton } from "@/components/ui/action-pill-button";
import { CLIENT_TYPE_LABELS, type CrmClient } from "@/lib/types";

interface ClientCardGridProps {
  clients: CrmClient[];
}

const statusConfig: Record<
  CrmClient["status"],
  { label: string; bgClass: string; textClass: string; dotClass: string }
> = {
  activo: {
    label: "Activo",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    dotClass: "bg-emerald-500",
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

const peritusStatusConfig: Record<string, { label: string; classes: string }> = {
  pendiente: { label: "Pendiente", classes: "bg-amber-50 text-amber-700" },
  revision: { label: "En revisión", classes: "bg-blue-50 text-blue-700" },
  aprobado: { label: "Aprobado", classes: "bg-emerald-50 text-emerald-700" },
  denegado: { label: "Denegado", classes: "bg-red-50 text-red-700" },
};

interface CopyFieldProps {
  label: string;
  value?: string | null;
  copied: boolean;
  multiline?: boolean;
  onCopy: () => void;
}

function CopyField({ label, value, copied, multiline = false, onCopy }: CopyFieldProps) {
  const displayValue = value?.trim() || "Sin información";
  const canCopy = Boolean(value?.trim());

  return (
    <div className="min-w-0 rounded-xl bg-muted/45 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
          {label}
        </p>
        <button
          type="button"
          onClick={onCopy}
          disabled={!canCopy}
          aria-label={`Copiar ${label.toLowerCase()}`}
          title={canCopy ? `Copiar ${label.toLowerCase()}` : `${label} sin información`}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-white hover:text-[#1b5697] focus-visible:ring-2 focus-visible:ring-[#2969b0] disabled:cursor-not-allowed disabled:opacity-35"
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <p
        title={canCopy ? value! : undefined}
        className={`mt-0.5 text-xs leading-4 ${
          canCopy ? "text-foreground" : "italic text-muted-foreground"
        } ${multiline ? "line-clamp-2 min-h-8" : "truncate"}`}
      >
        {displayValue}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function ClientCardGrid({ clients }: ClientCardGridProps) {
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const clearCopyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (clearCopyTimer.current) clearTimeout(clearCopyTimer.current);
  }, []);

  async function copyValue(clientId: string, field: string, label: string, value?: string | null) {
    const normalized = value?.trim();
    if (!normalized) return;

    try {
      await navigator.clipboard.writeText(normalized);
      const key = `${clientId}:${field}`;
      setCopiedKey(key);
      setCopyMessage(`${label} copiado`);
      if (clearCopyTimer.current) clearTimeout(clearCopyTimer.current);
      clearCopyTimer.current = setTimeout(() => {
        setCopiedKey("");
        setCopyMessage("");
      }, 1800);
    } catch {
      setCopyMessage(`No se pudo copiar ${label.toLowerCase()}`);
    }
  }

  function openAssociatedCases(client: CrmClient) {
    const count = client.associatedCasesCount || 0;
    if (count === 1 && client.soleAssociatedCaseId) {
      router.push(`/crm/cases/${client.soleAssociatedCaseId}`);
      return;
    }

    const params = new URLSearchParams({
      clientId: client._id,
      clientName: client.name || "Cliente",
    });
    router.push(`/crm/cases?${params.toString()}`);
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center shadow-sm">
        <UserRound className="mx-auto size-14 text-muted-foreground/35" aria-hidden="true" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">No hay clientes</h3>
        <p className="mt-1 text-sm text-muted-foreground">Los clientes que agregues aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <>
      <p className="sr-only" aria-live="polite">{copyMessage}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {clients.map((client) => {
          const status = statusConfig[client.status];
          const brand = client.brand || "CNP";
          const peritusStatus = client.peritusRegistro?.estadoDocumentacion;
          const docStatus = peritusStatus ? peritusStatusConfig[peritusStatus] : null;
          const clientType = client.clientType ? CLIENT_TYPE_LABELS[client.clientType] : "Cliente";
          const associatedCasesCount = client.associatedCasesCount || 0;

          return (
            <article
              key={client._id}
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white p-4 shadow-sm"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-0.5 ${brand === "Peritus" ? "bg-violet-500" : "bg-sky-500"}`}
              />

              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                    brand === "Peritus" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
                  }`}>
                    {brand}
                  </span>
                  {docStatus && brand === "Peritus" && (
                    <span className={`truncate rounded-full px-2 py-1 text-[10px] font-medium ${docStatus.classes}`}>
                      {docStatus.label}
                    </span>
                  )}
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium ${status.bgClass} ${status.textClass}`}>
                  <span className={`size-1.5 rounded-full ${status.dotClass}`} />
                  {status.label}
                </span>
              </div>

              <div className="mt-3 flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground" title={client.name}>
                    {client.name || "Sin nombre"}
                  </h2>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {client.position || clientType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(client._id, "name", "Nombre", client.name)}
                  disabled={!client.name?.trim()}
                  aria-label="Copiar nombre"
                  title="Copiar nombre"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground outline-none transition-colors hover:border-[#2969b0]/30 hover:bg-[#2969b0]/5 hover:text-[#1b5697] focus-visible:ring-2 focus-visible:ring-[#2969b0] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {copiedKey === `${client._id}:name`
                    ? <Check className="size-3.5 text-emerald-600" />
                    : <Copy className="size-3.5" />}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border/50 pt-3">
                <CopyField
                  label="Mail"
                  value={client.email}
                  copied={copiedKey === `${client._id}:email`}
                  onCopy={() => copyValue(client._id, "email", "Mail", client.email)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <CopyField
                    label="Empresa"
                    value={client.company}
                    copied={copiedKey === `${client._id}:company`}
                    onCopy={() => copyValue(client._id, "company", "Empresa", client.company)}
                  />
                  <CopyField
                    label="Teléfono"
                    value={client.phone}
                    copied={copiedKey === `${client._id}:phone`}
                    onCopy={() => copyValue(client._id, "phone", "Teléfono", client.phone)}
                  />
                </div>
                <CopyField
                  label="Notas"
                  value={client.notes}
                  multiline
                  copied={copiedKey === `${client._id}:notes`}
                  onCopy={() => copyValue(client._id, "notes", "Notas", client.notes)}
                />
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">{clientType}</p>
                  <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                    <span className="truncate font-medium text-foreground">{formatDate(client._createdAt)}</span>
                    <span className="text-muted-foreground">Casos: {associatedCasesCount}</span>
                    {associatedCasesCount > 0 && (
                      <button
                        type="button"
                        onClick={() => openAssociatedCases(client)}
                        className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#1b5697] outline-none hover:text-[#123e70] hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#2969b0]"
                        aria-label={`${associatedCasesCount === 1 ? "Ver caso" : "Ver casos"} de ${client.name}`}
                      >
                        <BriefcaseBusiness className="size-3" aria-hidden="true" />
                        {associatedCasesCount === 1 ? "Ver caso" : "Ver casos"}
                      </button>
                    )}
                  </div>
                </div>
                <ActionPillButton
                  type="button"
                  label="Editar"
                  icon={<Pencil className="size-3.5" />}
                  tone="blue"
                  className="min-h-8 shrink-0 px-3.5 py-1.5 text-xs"
                  onClick={() => router.push(`/crm/clients/${client._id}`)}
                />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
