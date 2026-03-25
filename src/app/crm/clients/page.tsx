"use client";

import { useEffect, useState, useCallback } from "react";
import { usePusher } from "@/hooks/usePusher";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ClientTable from "@/components/crm/ClientTable";
import { Skeleton } from "@/components/ui/skeleton";
import type { CrmClient } from "@/lib/types";

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border-b border-border/30 px-6 py-4 last:border-b-0">
          <div className="grid grid-cols-5 gap-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CrmClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchClients = useCallback(async (query: string, brand?: string) => {
    setLoading(true);
    setError("");

    try {
      const sp = new URLSearchParams();
      if (query) sp.set("search", query);
      if (brand) sp.set("brand", brand);
      const params = sp.toString() ? `?${sp}` : "";
      const res = await fetch(`/api/clients${params}`);
      const data = await res.json();

      if (data.success) {
        setClients(data.data);
      } else {
        setError(data.error || "Error al cargar clientes.");
      }
    } catch {
      setError("Error de conexion al cargar clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/crm/login");
        return;
      }
      const meData = await meRes.json();
      if (!meData.success) {
        router.push("/crm/login");
        return;
      }
      fetchClients("");
    }

    init();
  }, [router, fetchClients]);

  useEffect(() => {
    fetchClients(search, brandFilter);
  }, [brandFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  usePusher(['client:created', 'client:updated'], () => {
    fetchClients(search, brandFilter);
  });

  function handleSearch() {
    fetchClients(search, brandFilter);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <Users className="h-5 w-5" style={{ color: '#2969b0' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Clientes</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu cartera de clientes
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/crm/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por nombre, empresa o email..."
            className="pl-9"
          />
        </div>
        <Button variant="secondary" onClick={handleSearch}>
          Buscar
        </Button>
      </div>

      {/* Brand filter */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={brandFilter === "CNP" ? "default" : "outline"}
          size="sm"
          onClick={() => setBrandFilter(brandFilter === "CNP" ? "" : "CNP")}
        >
          CNP
        </Button>
        <Button
          variant={brandFilter === "Peritus" ? "default" : "outline"}
          size="sm"
          onClick={() => setBrandFilter(brandFilter === "Peritus" ? "" : "Peritus")}
        >
          Peritus
        </Button>
        {brandFilter && (
          <Button variant="ghost" size="sm" onClick={() => setBrandFilter("")}>
            Limpiar
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? <TableSkeleton /> : (
        <ClientTable
          clients={clients}
          showActions
          onValidated={() => fetchClients(search, brandFilter)}
        />
      )}
    </>
  );
}
