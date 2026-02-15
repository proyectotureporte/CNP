"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UsersRound } from "lucide-react";
import ClientTable from "@/components/crm/ClientTable";
import type { CrmClient, ApiResponse } from "@/lib/types";

function ClientsSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-4 w-40 rounded bg-gray-100" />
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="h-5 w-16 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients");

        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }

        const data: ApiResponse<CrmClient[]> = await res.json();

        if (data.success && data.data) {
          setClients(data.data);
        }
      } catch {
        // Network error
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, [router]);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;

    const term = search.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.company.toLowerCase().includes(term)
    );
  }, [clients, search]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
              <UsersRound className="h-5 w-5" style={{ color: '#2969b0' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Clientes</h1>
              <p className="text-sm text-muted-foreground">
                Vista de todos los clientes del sistema
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label htmlFor="search" className="sr-only">
            Buscar clientes
          </label>
          <div className="relative max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o empresa..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#2969b0] focus:outline-none focus:ring-2 focus:ring-[#2969b0]/20"
            />
          </div>
        </div>

        {loading ? (
          <ClientsSkeleton />
        ) : (
          <ClientTable clients={filteredClients} showActions={false} />
        )}
    </>
  );
}
