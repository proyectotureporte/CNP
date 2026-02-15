"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Activity,
  Users,
  UserCheck,
  Clock,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  type CaseStatus,
  type CaseExpanded,
} from "@/lib/types";

// --------------------------------------------------
// Types
// --------------------------------------------------

interface DashboardStatsData {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  totalExperts: number;
  pendingPayments: number;
  totalRevenue: number;
  pendingActions: number;
  casesByStatus: Record<string, number>;
  recentCases: CaseExpanded[];
}

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: string;
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function formatCOP(amount: number): string {
  return `$${amount.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// --------------------------------------------------
// Sub-components
// --------------------------------------------------

function KpiCard({ title, value, description, icon }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">
          {title}
        </CardDescription>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* KPI skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
            <Skeleton className="mt-4 h-7 w-20" />
            <Skeleton className="mt-2 h-2 w-32" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="mb-6 h-5 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-48 flex-1" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// Main page
// --------------------------------------------------

export default function ExecutiveDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Error al cargar estadisticas.");
          return;
        }

        setStats(data.data);
      } catch {
        setError("Error de conexion al cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Build chart data from casesByStatus
  const chartData = stats
    ? Object.entries(stats.casesByStatus).map(([status, count]) => ({
        name: CASE_STATUS_LABELS[status as CaseStatus] ?? status,
        casos: count,
        fill: getBarColor(status as CaseStatus),
      }))
    : [];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard Ejecutivo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista general del rendimiento y actividad del sistema
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <DashboardSkeleton />}

      {/* Content */}
      {stats && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Casos"
              value={stats.totalCases}
              description="Casos registrados en el sistema"
              icon={<Briefcase className="h-5 w-5" />}
            />
            <KpiCard
              title="Casos Activos"
              value={stats.activeCases}
              description="En produccion, revision o asignacion"
              icon={<Activity className="h-5 w-5" />}
            />
            <KpiCard
              title="Total Clientes"
              value={stats.totalClients}
              description="Clientes registrados"
              icon={<Users className="h-5 w-5" />}
            />
            <KpiCard
              title="Total Peritos"
              value={stats.totalExperts}
              description="Peritos en el directorio"
              icon={<UserCheck className="h-5 w-5" />}
            />
            <KpiCard
              title="Pagos Pendientes"
              value={stats.pendingPayments}
              description="Pagos por confirmar"
              icon={<Clock className="h-5 w-5" />}
            />
            <KpiCard
              title="Ingresos Totales"
              value={formatCOP(stats.totalRevenue)}
              description="Ingresos acumulados (COP)"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <KpiCard
              title="Acciones Pendientes"
              value={stats.pendingActions}
              description="Requieren atencion inmediata"
              icon={<AlertCircle className="h-5 w-5" />}
            />
          </div>

          {/* Cases by Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Casos por Estado</CardTitle>
              <CardDescription>
                Distribucion de casos segun su estado actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                        formatter={(value) => [String(value), "Casos"]}
                      />
                      <Bar
                        dataKey="casos"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={48}
                        fill="var(--chart-1)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay datos de casos disponibles.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Cases Table */}
          <Card>
            <CardHeader>
              <CardTitle>Casos Recientes</CardTitle>
              <CardDescription>
                Ultimos 5 casos registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentCases.length > 0 ? (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Codigo</TableHead>
                        <TableHead>Titulo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">
                          Monto Est.
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentCases.map((c) => {
                        const statusColor =
                          CASE_STATUS_COLORS[c.status as CaseStatus];
                        return (
                          <TableRow key={c._id}>
                            <TableCell className="font-mono text-xs">
                              <Link
                                href={`/crm/cases/${c._id}`}
                                className="text-primary hover:underline"
                              >
                                {c.caseCode}
                              </Link>
                            </TableCell>
                            <TableCell className="max-w-[250px] truncate font-medium">
                              <Link
                                href={`/crm/cases/${c._id}`}
                                className="hover:underline"
                              >
                                {c.title}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {c.client?.name || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${statusColor?.bg} ${statusColor?.text} border-0`}
                              >
                                <span
                                  className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusColor?.dot}`}
                                />
                                {CASE_STATUS_LABELS[c.status as CaseStatus] ||
                                  c.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {c.estimatedAmount
                                ? formatCOP(c.estimatedAmount)
                                : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay casos recientes.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// Chart color helper
// --------------------------------------------------

function getBarColor(status: CaseStatus): string {
  const colorMap: Record<CaseStatus, string> = {
    creado: "#6b7280",
    en_cotizacion: "#3b82f6",
    pendiente_aprobacion: "#f59e0b",
    aprobado: "#22c55e",
    en_asignacion: "#06b6d4",
    en_produccion: "#6366f1",
    en_revision: "#f97316",
    finalizado: "#10b981",
    archivado: "#64748b",
    rechazado: "#ef4444",
  };
  return colorMap[status] || "#6b7280";
}
