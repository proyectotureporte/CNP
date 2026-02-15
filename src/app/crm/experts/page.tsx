"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Search, Star, MapPin, Briefcase, ChevronLeft, ChevronRight, UserSearch,
} from "lucide-react";
import {
  CASE_DISCIPLINES, DISCIPLINE_LABELS,
  EXPERT_AVAILABILITY_LABELS, EXPERT_AVAILABILITY_COLORS,
  EXPERT_VALIDATION_LABELS, EXPERT_VALIDATION_COLORS,
  type Expert, type CaseDiscipline,
  type ExpertAvailability, type ExpertValidationStatus,
} from "@/lib/types";

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [availability, setAvailability] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  async function loadExperts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (discipline) params.set("discipline", discipline);
      if (availability) params.set("availability", availability);
      params.set("page", String(page));
      params.set("limit", "12");

      const res = await fetch(`/api/experts?${params}`);
      const data = await res.json();
      if (data.success) {
        setExperts(data.data);
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || 0);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadExperts(); }, [page, discipline, availability]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadExperts();
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <UserSearch className="h-5 w-5" style={{ color: '#2969b0' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Peritos</h1>
            <p className="text-sm text-muted-foreground">
              {total} perito{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/crm/experts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Perito
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por especializacion, ciudad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
        <Select value={discipline} onValueChange={(v) => { setDiscipline(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Disciplina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CASE_DISCIPLINES.map((d) => (
              <SelectItem key={d} value={d}>{DISCIPLINE_LABELS[d as CaseDiscipline]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availability} onValueChange={(v) => { setAvailability(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Disponibilidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="ocupado">Ocupado</SelectItem>
            <SelectItem value="no_disponible">No Disponible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expert Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : experts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron peritos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert) => {
            const availColor = EXPERT_AVAILABILITY_COLORS[expert.availability];
            const valColor = EXPERT_VALIDATION_COLORS[expert.validationStatus];
            return (
              <Link key={expert._id} href={`/crm/experts/${expert._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          {expert.user?.displayName || "Sin nombre"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {expert.specialization || "Sin especializacion"}
                        </p>
                      </div>
                      <Badge className={`${valColor?.bg} ${valColor?.text} border-0 text-xs`}>
                        {EXPERT_VALIDATION_LABELS[expert.validationStatus]}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {expert.disciplines?.slice(0, 3).map((d) => (
                        <Badge key={d} variant="outline" className="text-xs">
                          {DISCIPLINE_LABELS[d as CaseDiscipline] || d}
                        </Badge>
                      ))}
                      {(expert.disciplines?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{expert.disciplines.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {expert.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {expert.city}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {expert.experienceYears || 0} anos
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        {(expert.rating || 0).toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Badge className={`${availColor?.bg} ${availColor?.text} border-0 text-xs`}>
                        <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${availColor?.dot}`} />
                        {EXPERT_AVAILABILITY_LABELS[expert.availability]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {expert.completedCases}/{expert.totalCases} casos
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
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
            Pagina {page} de {totalPages}
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
