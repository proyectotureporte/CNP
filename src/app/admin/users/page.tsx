"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { usePusher } from "@/hooks/usePusher";
import UserTable from "@/components/crm/UserTable";
import type { CrmUser, ApiResponse } from "@/lib/types";

function UsersSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
            <div className="h-5 w-14 rounded-full bg-gray-100" />
            <div className="h-8 w-20 rounded-lg bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActiveInternalOnly, setShowActiveInternalOnly] = useState(false);

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users");

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data: ApiResponse<CrmUser[]> = await res.json();

      if (data.success && data.data) {
        setUsers(data.data);
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowActiveInternalOnly(
      params.get('scope') === 'internal' && params.get('status') === 'active'
    );
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePusher(['user:created', 'user:updated'], () => { loadUsers(); });

  const visibleUsers = useMemo(
    () => showActiveInternalOnly
      ? users.filter((user) => user.active && user.role !== 'cliente')
      : users,
    [showActiveInternalOnly, users],
  );

  async function handleDeactivate(id: string) {
    const confirmed = window.confirm(
      "¿Está seguro de que desea desactivar este usuario?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadUsers();
      }
    } catch {
      // Network error
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
              <Users className="h-5 w-5" style={{ color: '#2969b0' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Usuarios</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona los usuarios del sistema
              </p>
            </div>
          </div>
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2969b0] focus:ring-offset-2"
            style={{ background: 'linear-gradient(135deg, #2969b0, #1b5697)' }}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Usuario
          </Link>
        </div>

        {showActiveInternalOnly && !loading && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2969b0]/15 bg-[#2969b0]/5 px-4 py-3 text-sm">
            <span className="font-medium text-[#1b5697]">
              Mostrando {visibleUsers.length} cuentas internas activas
            </span>
            <Link href="/admin/users" className="text-xs font-semibold text-[#2969b0] hover:underline">
              Ver todos los usuarios
            </Link>
          </div>
        )}

        {loading ? <UsersSkeleton /> : (
          <UserTable users={visibleUsers} onDeactivate={handleDeactivate} />
        )}
    </>
  );
}
