"use client";

import { useEffect, useState, useCallback } from "react";
import { usePusher } from "@/hooks/usePusher";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientCardGrid from "@/components/crm/ClientCardGrid";
import { Skeleton } from "@/components/ui/skeleton";
import type { CrmClient } from "@/lib/types";

const CLIENTS_PER_PAGE = 20;

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
          <div className="mt-4 space-y-2 border-t pt-3">
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-8 w-20 rounded-full" />
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
  const [hasCasesFilter, setHasCasesFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [page, setPage] = useState(1);

  const fetchClients = useCallback(async (query: string, brand?: string, hasCases = false) => {
    setLoading(true);
    setError("");

    try {
      const sp = new URLSearchParams();
      if (query) sp.set("search", query);
      if (brand) sp.set("brand", brand);
      if (hasCases) sp.set("hasCases", "true");
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
      setAuthorized(true);
    }

    init();
  }, [router, fetchClients]);

  useEffect(() => {
    if (!authorized) return;

    setPage(1);
    const timeout = window.setTimeout(() => {
      fetchClients(search, brandFilter, hasCasesFilter);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [authorized, search, brandFilter, hasCasesFilter, fetchClients]);

  usePusher(['client:created', 'client:updated', 'client:deleted'], () => {
    if (authorized) fetchClients(search, brandFilter, hasCasesFilter);
  });

  const totalPages = Math.max(1, Math.ceil(clients.length / CLIENTS_PER_PAGE));
  const visibleClients = clients.slice(
    (page - 1) * CLIENTS_PER_PAGE,
    page * CLIENTS_PER_PAGE,
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, empresa o email..."
            className="pl-9"
          />
        </div>
        <Button asChild className="sm:ml-auto">
          <Link href="/crm/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      {/* Brand filter */}
      <div className="mb-6 flex flex-wrap gap-2">
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
        <Select
          value={hasCasesFilter ? "with-cases" : "all"}
          onValueChange={(value) => setHasCasesFilter(value === "with-cases")}
        >
          <SelectTrigger className="h-8 w-full sm:w-[210px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            <SelectItem value="with-cases">Con casos asignados</SelectItem>
          </SelectContent>
        </Select>
        {(brandFilter || hasCasesFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setBrandFilter(""); setHasCasesFilter(false); }}>
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

      {/* Client cards */}
      {loading ? <CardsSkeleton /> : <ClientCardGrid clients={visibleClients} />}

      {!loading && clients.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} ({clients.length} clientes)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
