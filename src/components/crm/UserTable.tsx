"use client";

import type { CrmUser } from "@/lib/types";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/types";

interface UserTableProps {
  users: CrmUser[];
  onDeactivate?: (id: string) => void;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("es-CO");
  } catch {
    return dateString;
  }
}

function BanIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="m4.93 4.93 14.14 14.14" />
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

function RoleBadge({ role }: { role: CrmUser["role"] }) {
  const colors = ROLE_COLORS[role] || ROLE_COLORS.comercial;
  const label = ROLE_LABELS[role] || role;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}

export default function UserTable({ users, onDeactivate }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
        <EmptyUsersIcon />
        <h3 className="mt-4 text-sm font-semibold text-gray-500">
          No hay usuarios
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          Los usuarios que crees apareceran aqui
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
                Username
              </th>
              <th scope="col" className={thClass}>
                Nombre
              </th>
              <th scope="col" className={thClass}>
                Email
              </th>
              <th scope="col" className={thClass}>
                Rol
              </th>
              <th scope="col" className={thClass}>
                Estado
              </th>
              <th scope="col" className={thClass}>
                Fecha
              </th>
              <th scope="col" className={thClass}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user._id}
                className="border-b border-gray-50 transition-all duration-200 hover:bg-gray-50/50"
              >
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-gray-900">
                  {user.username}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-600">
                  {user.displayName}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                  {user.email || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                  <RoleBadge role={user.role} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                  {user.active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                  {formatDate(user._createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                  {user.active && onDeactivate && (
                    <button
                      onClick={() => onDeactivate(user._id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
                    >
                      <BanIcon />
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
