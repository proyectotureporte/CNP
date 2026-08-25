"use client";

import { useEffect, useState, useCallback } from "react";
import { usePusher } from "@/hooks/usePusher";
import Link from "next/link";
import { Plus, Search, Filter, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { CaseCard } from "@/components/cases/CaseCard";
import {
  CaseQuickAssignmentDialog,
  type QuickAssignmentMode,
} from "@/components/cases/CaseQuickAssignmentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CASE_STATUS_LABELS,
  DISCIPLINE_LABELS,
  CASE_STATUSES,
  CASE_DISCIPLINES,
  type CaseExpanded,
} from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { canAssignExpert, canCreateCase, canEditCase } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/types";

function CasesCardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-3/5" />
          <Skeleton className="mt-4 h-9 w-full" />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CrmCasesPage() {
  const { user } = useAuth();
  const canCreate = !!user && canCreateCase(user.role as UserRole, user.allRoles);
  const canAssignPerito = !!user && canAssignExpert(user.role as UserRole, user.allRoles);
  const canAssignClient = !!user && canEditCase(user.role as UserRole, user.allRoles);
  const isExpert = user?.role === "perito";
  const [cases, setCases] = useState<CaseExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [clientIdFilter, setClientIdFilter] = useState("");
  const [expertIdFilter, setExpertIdFilter] = useState("");
  const [associationLabel, setAssociationLabel] = useState("");
  const [urlFiltersReady, setUrlFiltersReady] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [quickAssignment, setQuickAssignment] = useState<{
    item: CaseExpanded;
    mode: QuickAssignmentMode;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedBrand = params.get('brand');
    const requestedDeadline = params.get('deadlineFilter');
    const requestedClientId = params.get('clientId');
    const requestedExpertId = params.get('expertId');
    const requestedName = params.get('clientName') || params.get('expertName');

    if (requestedBrand === 'CNP' || requestedBrand === 'Peritus') {
      setBrandFilter(requestedBrand);
    }
    if (requestedDeadline === 'proximos' || requestedDeadline === 'urgente') {
      setDeadlineFilter(requestedDeadline);
    }
    if (requestedClientId) setClientIdFilter(requestedClientId);
    if (requestedExpertId) setExpertIdFilter(requestedExpertId);
    if ((requestedClientId || requestedExpertId) && requestedName) setAssociationLabel(requestedName);
    setUrlFiltersReady(true);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const fetchCases = useCallback(async () => {
    if (!urlFiltersReady) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (disciplineFilter) params.set("discipline", disciplineFilter);
      if (brandFilter) params.set("brand", brandFilter);
      if (deadlineFilter) params.set("deadlineFilter", deadlineFilter);
      if (clientIdFilter) params.set("clientId", clientIdFilter);
      if (expertIdFilter) params.set("expertId", expertIdFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/cases?${params}`);
      const data = await res.json();

      if (data.success) {
        setCases(data.data);
        setTotal(data.meta?.total || 0);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, [urlFiltersReady, debouncedSearch, statusFilter, disciplineFilter, brandFilter, deadlineFilter, clientIdFilter, expertIdFilter, page]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  usePusher(
    ['case:created', 'case:updated', 'case:status-changed', 'case:assigned'],
    () => { fetchCases(); }
  );

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setDisciplineFilter("");
    setBrandFilter("");
    setDeadlineFilter("");
    setClientIdFilter("");
    setExpertIdFilter("");
    setAssociationLabel("");
    window.history.replaceState(null, "", "/crm/cases");
    setPage(1);
  }

  return (
    <>
      {(clientIdFilter || expertIdFilter) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <p>
            Mostrando casos asociados a <strong>{associationLabel || (clientIdFilter ? "este cliente" : "este perito")}</strong>
          </p>
          <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="bg-white">
            Ver todos los casos
          </Button>
        </div>
      )}

      {/* Brand filter tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant={brandFilter === "" ? "default" : "outline"}
          size="sm"
          onClick={() => { setBrandFilter(""); setPage(1); }}
        >
          Todos
        </Button>
        <Button
          variant={brandFilter === "CNP" ? "default" : "outline"}
          size="sm"
          onClick={() => { setBrandFilter(brandFilter === "CNP" ? "" : "CNP"); setPage(1); }}
          className={brandFilter === "CNP" ? "bg-sky-600 hover:bg-sky-700" : ""}
        >
          CNP
        </Button>
        <Button
          variant={brandFilter === "Peritus" ? "default" : "outline"}
          size="sm"
          onClick={() => { setBrandFilter(brandFilter === "Peritus" ? "" : "Peritus"); setPage(1); }}
          className={brandFilter === "Peritus" ? "bg-violet-600 hover:bg-violet-700" : ""}
        >
          Peritus
        </Button>
        {canCreate && (
          <Button asChild className="ml-auto">
            <Link href="/crm/cases/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Caso
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por caso, codigo o ciudad..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {CASE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{CASE_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={disciplineFilter} onValueChange={(v) => { setDisciplineFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las disciplinas</SelectItem>
            {CASE_DISCIPLINES.map((d) => (
              <SelectItem key={d} value={d}>{DISCIPLINE_LABELS[d]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || statusFilter || disciplineFilter || brandFilter || deadlineFilter || clientIdFilter || expertIdFilter) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Deadline filter buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={deadlineFilter === "proximos" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setDeadlineFilter(deadlineFilter === "proximos" ? "" : "proximos");
            setPage(1);
          }}
          className={deadlineFilter === "proximos" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
        >
          <Clock className="mr-1.5 h-4 w-4" />
          Proximos a vencer
        </Button>
        <Button
          variant={deadlineFilter === "urgente" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setDeadlineFilter(deadlineFilter === "urgente" ? "" : "urgente");
            setPage(1);
          }}
          className={deadlineFilter === "urgente" ? "bg-red-600 hover:bg-red-700" : ""}
        >
          <AlertTriangle className="mr-1.5 h-4 w-4" />
          Urgente
        </Button>
        <Button
          variant={statusFilter === "creado" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setStatusFilter(statusFilter === "creado" ? "" : "creado");
            setDeadlineFilter("");
            setPage(1);
          }}
          className={statusFilter === "creado" ? "bg-gray-600 hover:bg-gray-700" : ""}
        >
          Creado
        </Button>
        <Button
          variant={statusFilter === "gestionado" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setStatusFilter(statusFilter === "gestionado" ? "" : "gestionado");
            setDeadlineFilter("");
            setPage(1);
          }}
          className={statusFilter === "gestionado" ? "bg-violet-600 hover:bg-violet-700" : "border-violet-300 text-violet-700 hover:bg-violet-50"}
        >
          <CheckCircle className="mr-1.5 h-4 w-4" />
          Gestionado
        </Button>
        <Button
          variant={statusFilter === "cancelado" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setStatusFilter(statusFilter === "cancelado" ? "" : "cancelado");
            setDeadlineFilter("");
            setPage(1);
          }}
          className={statusFilter === "cancelado" ? "bg-red-600 hover:bg-red-700" : "border-red-300 text-red-700 hover:bg-red-50"}
        >
          <AlertTriangle className="mr-1.5 h-4 w-4" />
          Cancelado
        </Button>
      </div>

      {/* Case cards */}
      {loading ? (
        <CasesCardSkeleton />
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">No se encontraron casos</p>
          {canCreate && (
            <Button asChild variant="link" className="mt-2">
              <Link href="/crm/cases/new">Crear el primer caso</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cases.map((item) => (
              <CaseCard
                key={item._id}
                item={item}
                hidePrivateDetails={isExpert}
                onAssignExpert={canAssignPerito ? (selectedCase) => setQuickAssignment({ item: selectedCase, mode: "expert" }) : undefined}
                onAssignClient={canAssignClient ? (selectedCase) => setQuickAssignment({ item: selectedCase, mode: "client" }) : undefined}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Pagina {page} de {totalPages} ({total} casos)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <CaseQuickAssignmentDialog
        caseItem={quickAssignment?.item || null}
        mode={quickAssignment?.mode || null}
        open={Boolean(quickAssignment)}
        onOpenChange={(open) => { if (!open) setQuickAssignment(null); }}
        onAssigned={fetchCases}
      />
    </>
  );
}
