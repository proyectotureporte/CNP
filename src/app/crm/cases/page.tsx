"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  DISCIPLINE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  CASE_STATUSES,
  CASE_DISCIPLINES,
  type CaseExpanded,
  type CaseStatus,
  type CaseDiscipline,
} from "@/lib/types";

function CasesTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function CrmCasesPage() {
  const [cases, setCases] = useState<CaseExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (disciplineFilter) params.set("discipline", disciplineFilter);
      params.set("page", String(page));
      params.set("limit", "15");

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
  }, [search, statusFilter, disciplineFilter, page]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  function handleSearch() {
    setPage(1);
    fetchCases();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setDisciplineFilter("");
    setPage(1);
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <Briefcase className="h-5 w-5" style={{ color: '#2969b0' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Casos</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los dictamenes periciales ({total} casos)
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/crm/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Caso
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por titulo, codigo o ciudad..."
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
        {(search || statusFilter || disciplineFilter) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <CasesTableSkeleton />
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">No se encontraron casos</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/crm/cases/new">Crear el primer caso</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">Codigo</TableHead>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead className="text-right">Monto Est.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((c) => {
                  const statusColor = CASE_STATUS_COLORS[c.status as CaseStatus];
                  const priorityColor = PRIORITY_COLORS[c.priority];
                  return (
                    <TableRow key={c._id}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/crm/cases/${c._id}`} className="text-primary hover:underline">
                          {c.caseCode}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate font-medium">
                        <Link href={`/crm/cases/${c._id}`} className="hover:underline">
                          {c.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.client?.name || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {DISCIPLINE_LABELS[c.discipline as CaseDiscipline] || c.discipline}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusColor?.bg} ${statusColor?.text} border-0`}>
                          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusColor?.dot}`} />
                          {CASE_STATUS_LABELS[c.status as CaseStatus] || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${priorityColor?.bg} ${priorityColor?.text} border-0`}>
                          {PRIORITY_LABELS[c.priority] || c.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {c.estimatedAmount
                          ? `$${c.estimatedAmount.toLocaleString("es-CO")}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
    </>
  );
}
