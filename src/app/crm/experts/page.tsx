"use client";

import { useCallback, useEffect, useState } from "react";
import { usePusher } from "@/hooks/usePusher";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ExpertCardGrid from "@/components/experts/ExpertCardGrid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  CASE_DISCIPLINES, DISCIPLINE_LABELS,
  EXPERT_VALIDATION_LABELS, EXPERT_VALIDATION_STATUSES,
  EXPERT_SENIORITY_LABELS, EXPERT_SENIORITIES,
  EXPERT_CATEGORY_LABELS, EXPERT_CATEGORIES,
  type Expert, type CaseDiscipline,
  type UserRole,
} from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { canAssignExpert, canManageExperts } from "@/lib/auth/permissions";

export default function ExpertsPage() {
  const { user } = useAuth();
  const canManage = !!user && canManageExperts(user.role as UserRole, user.allRoles);
  const canAssign = !!user && canAssignExpert(user.role as UserRole, user.allRoles);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [availability, setAvailability] = useState("");
  const [validationStatus, setValidationStatus] = useState("");
  const [seniority, setSeniority] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadExperts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (discipline) params.set("discipline", discipline);
      if (availability) params.set("availability", availability);
      if (validationStatus) params.set("validationStatus", validationStatus);
      if (seniority) params.set("seniority", seniority);
      if (category) params.set("category", category);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/experts?${params}`);
      const data = await res.json();
      if (data.success) {
        setExperts(data.data);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [debouncedSearch, discipline, availability, validationStatus, seniority, category, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => { loadExperts(); }, [loadExperts]);

  usePusher(['expert:created', 'expert:updated'], () => { loadExperts(); });

  return (
    <>
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por especializacion, ciudad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {canManage && (
            <Button asChild>
              <Link href="/crm/experts/new">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Perito
              </Link>
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Select value={validationStatus || "all"} onValueChange={(v) => { setValidationStatus(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {EXPERT_VALIDATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{EXPERT_VALIDATION_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={seniority || "all"} onValueChange={(v) => { setSeniority(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Nivel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              {EXPERT_SENIORITIES.map((s) => (
                <SelectItem key={s} value={s}>{EXPERT_SENIORITY_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category || "all"} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {EXPERT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{EXPERT_CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={discipline || "all"} onValueChange={(v) => { setDiscipline(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Disciplina" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CASE_DISCIPLINES.map((d) => (
                <SelectItem key={d} value={d}>{DISCIPLINE_LABELS[d as CaseDiscipline]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={availability || "all"} onValueChange={(v) => { setAvailability(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Disponibilidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="ocupado">Ocupado</SelectItem>
              <SelectItem value="no_disponible">No Disponible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expert Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 12 }, (_, index) => (
            <Skeleton key={index} className="h-[390px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <ExpertCardGrid experts={experts} canAssign={canAssign} onAssigned={loadExperts} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
