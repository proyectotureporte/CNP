"use client";

import Link from "next/link";
import type { CrmClient } from "@/lib/types";

interface ClientTableProps {
  clients: CrmClient[];
  showActions?: boolean;
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
}: ClientTableProps) {
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
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
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
              return (
                <tr
                  key={client._id}
                  className="border-b border-gray-50 transition-all duration-200 hover:bg-gray-50/50"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-gray-900">
                    {client.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-600">
                    {client.email}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-600">
                    {client.company}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bgClass} ${status.textClass}`}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                      />
                      {status.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                    {formatDate(client._createdAt)}
                  </td>
                  {showActions && (
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                      <div className="flex items-center gap-1">
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
  );
}
