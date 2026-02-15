"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, FileSpreadsheet, DollarSign, Users, Briefcase, BarChart3 } from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CASE_DISCIPLINES,
  DISCIPLINE_LABELS,
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  EXPERT_AVAILABILITY_LABELS,
  EXPERT_AVAILABILITY_COLORS,
  type CaseDiscipline,
  type CaseStatus,
  type ExpertAvailability,
} from "@/lib/types";

// -----------------------------------------------------------
// Types for each report API response
// -----------------------------------------------------------

interface CaseReportRow {
  caseCode: string;
  title: string;
  discipline: CaseDiscipline;
  status: CaseStatus;
  clientName: string;
  estimatedAmount: number | null;
}

interface ExpertPerformanceRow {
  name: string;
  disciplines: string[];
  rating: number;
  experienceYears: number;
  completedCases: number;
  totalCases: number;
  availability: ExpertAvailability;
}

interface RevenuePaymentRow {
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  caseCode: string;
}

interface RevenueData {
  totalRevenue: number;
  payments: RevenuePaymentRow[];
}

// -----------------------------------------------------------
// Skeleton loaders
// -----------------------------------------------------------

function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-24" />
          ))}
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------
// CSV export helper
// -----------------------------------------------------------

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escapeCell = (cell: string) => {
    if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------
// Tab: Casos
// -----------------------------------------------------------

function CasesReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState<CaseReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (discipline) params.set("discipline", discipline);
      if (status) params.set("status", status);

      const res = await fetch(`/api/reports/cases?${params}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data ?? []);
      } else {
        setData([]);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [startDate, endDate, discipline, status]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  function handleExportCSV() {
    const headers = [
      "Codigo",
      "Titulo",
      "Disciplina",
      "Estado",
      "Cliente",
      "Monto Estimado",
    ];
    const rows = data.map((row) => [
      row.caseCode,
      row.title,
      DISCIPLINE_LABELS[row.discipline] ?? row.discipline,
      CASE_STATUS_LABELS[row.status] ?? row.status,
      row.clientName ?? "-",
      row.estimatedAmount != null ? String(row.estimatedAmount) : "",
    ]);
    downloadCSV("reporte-casos.csv", headers, rows);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Filtra los casos por fecha, disciplina o estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
            <div className="space-y-1.5">
              <label htmlFor="cases-start-date" className="text-sm font-medium">
                Fecha inicio
              </label>
              <Input
                id="cases-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[170px]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cases-end-date" className="text-sm font-medium">
                Fecha fin
              </label>
              <Input
                id="cases-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[170px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Disciplina</label>
              <Select
                value={discipline}
                onValueChange={(v) => setDiscipline(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las disciplinas</SelectItem>
                  {CASE_DISCIPLINES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DISCIPLINE_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado</label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {CASE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {CASE_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Cargando..."
            : `${data.length} caso${data.length !== 1 ? "s" : ""} encontrado${data.length !== 1 ? "s" : ""}`}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={data.length === 0 || loading}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : !fetched ? null : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No se encontraron casos con los filtros aplicados</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Codigo</TableHead>
                <TableHead>Titulo</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Monto Est.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => {
                const statusColor = CASE_STATUS_COLORS[row.status];
                return (
                  <TableRow key={`${row.caseCode}-${idx}`}>
                    <TableCell className="font-mono text-xs">{row.caseCode}</TableCell>
                    <TableCell className="max-w-[250px] truncate font-medium">
                      {row.title}
                    </TableCell>
                    <TableCell className="text-sm">
                      {DISCIPLINE_LABELS[row.discipline] ?? row.discipline}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusColor?.bg} ${statusColor?.text} border-0`}
                      >
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusColor?.dot}`}
                        />
                        {CASE_STATUS_LABELS[row.status] ?? row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.clientName || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {row.estimatedAmount != null
                        ? `$${row.estimatedAmount.toLocaleString("es-CO")}`
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------
// Tab: Rendimiento Peritos
// -----------------------------------------------------------

function ExpertsPerformanceReport() {
  const [data, setData] = useState<ExpertPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch("/api/reports/experts-performance");
        const json = await res.json();
        if (json.success) {
          setData(json.data ?? []);
        } else {
          setData([]);
        }
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function renderRatingStars(rating: number) {
    const rounded = Math.round(rating * 10) / 10;
    return (
      <span className="font-mono text-sm" title={`${rounded} / 5`}>
        {rounded.toFixed(1)}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Cargando..."
            : `${data.length} perito${data.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Users className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No hay datos de peritos disponibles</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Disciplinas</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-center">Exp. (anios)</TableHead>
                <TableHead className="text-center">Casos</TableHead>
                <TableHead>Disponibilidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => {
                const availColor = EXPERT_AVAILABILITY_COLORS[row.availability];
                return (
                  <TableRow key={`${row.name}-${idx}`}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.disciplines.map((d) => (
                          <Badge key={d} variant="secondary" className="text-xs">
                            {DISCIPLINE_LABELS[d as CaseDiscipline] ?? d}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {renderRatingStars(row.rating)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {row.experienceYears}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {row.completedCases}/{row.totalCases}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${availColor?.bg} ${availColor?.text} border-0`}
                      >
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${availColor?.dot}`}
                        />
                        {EXPERT_AVAILABILITY_LABELS[row.availability] ?? row.availability}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------
// Tab: Ingresos
// -----------------------------------------------------------

function RevenueReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/reports/revenue?${params}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data ?? null);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const payments = data?.payments ?? [];
  const totalRevenue = data?.totalRevenue ?? 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Filtra los ingresos por rango de fechas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <label htmlFor="revenue-start-date" className="text-sm font-medium">
                Fecha inicio
              </label>
              <Input
                id="revenue-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[170px]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="revenue-end-date" className="text-sm font-medium">
                Fecha fin
              </label>
              <Input
                id="revenue-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[170px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total revenue card */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <DollarSign className="h-6 w-6 text-[#2969b0]" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
            {loading ? (
              <Skeleton className="mt-1 h-8 w-40" />
            ) : (
              <p className="text-3xl font-bold tracking-tight">
                ${totalRevenue.toLocaleString("es-CO")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments table */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Cargando..."
            : `${payments.length} pago${payments.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : !fetched ? null : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <DollarSign className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No se encontraron pagos en el rango seleccionado</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha de Pago</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Metodo de Pago</TableHead>
                <TableHead>Codigo de Caso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((row, idx) => (
                <TableRow key={`${row.caseCode}-${row.paymentDate}-${idx}`}>
                  <TableCell className="text-sm">
                    {row.paymentDate
                      ? new Date(row.paymentDate).toLocaleDateString("es-CO", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    ${row.amount.toLocaleString("es-CO")}
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {row.paymentMethod || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.caseCode || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------
// Main page
// -----------------------------------------------------------

export default function CrmReportsPage() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <BarChart3 className="h-5 w-5" style={{ color: '#2969b0' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Reportes</h1>
            <p className="text-sm text-muted-foreground">
              Consulta reportes de casos, rendimiento de peritos e ingresos
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="casos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="casos">
            <Briefcase className="mr-1.5 h-4 w-4" />
            Casos
          </TabsTrigger>
          <TabsTrigger value="peritos">
            <Users className="mr-1.5 h-4 w-4" />
            Rendimiento Peritos
          </TabsTrigger>
          <TabsTrigger value="ingresos">
            <DollarSign className="mr-1.5 h-4 w-4" />
            Ingresos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="casos">
          <CasesReport />
        </TabsContent>

        <TabsContent value="peritos">
          <ExpertsPerformanceReport />
        </TabsContent>

        <TabsContent value="ingresos">
          <RevenueReport />
        </TabsContent>
      </Tabs>
    </>
  );
}
