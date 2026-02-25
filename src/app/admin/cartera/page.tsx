"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, DollarSign, AlertTriangle, Clock, TrendingUp,
  ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS, type Payment } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import Link from "next/link";

interface CarteraData {
  monthPayments: Payment[];
  upcoming: Payment[];
  overdue: Payment[];
  historical: { _id: string; amount: number; dueDate: string; status: string }[];
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function CarteraPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<CarteraData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cartera?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handlePrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  }

  function handleNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  }

  // Compute KPIs
  const previsto = data?.monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const cobrado = data?.monthPayments?.filter(p => p.status === "validado").reduce((sum, p) => sum + p.amount, 0) || 0;
  const pendiente = previsto - cobrado;

  // Build chart data from historical
  const chartData = buildChartData(data?.historical || []);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cartera</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Previsto</p>
                    <p className="text-2xl font-bold">{formatCurrency(previsto)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2.5">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cobrado</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(cobrado)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2.5">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendiente</p>
                    <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendiente)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Month Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pagos del Mes - {MONTHS[month - 1]} {year}</CardTitle>
            </CardHeader>
            <CardContent>
              {(!data?.monthPayments || data.monthPayments.length === 0) ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sin pagos programados este mes</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium text-muted-foreground">Caso</th>
                        <th className="pb-2 font-medium text-muted-foreground">Cliente</th>
                        <th className="pb-2 font-medium text-muted-foreground">Monto</th>
                        <th className="pb-2 font-medium text-muted-foreground">Vence</th>
                        <th className="pb-2 font-medium text-muted-foreground">Estado</th>
                        <th className="pb-2 font-medium text-muted-foreground">Justificante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthPayments.map((p) => {
                        const sc = PAYMENT_STATUS_COLORS[p.status];
                        return (
                          <tr key={p._id} className="border-b last:border-0">
                            <td className="py-2.5">
                              {p.caseRef ? (
                                <Link href={`/crm/cases/${p.caseRef._id}`} className="text-primary hover:underline">
                                  {p.caseRef.caseCode}
                                </Link>
                              ) : "-"}
                            </td>
                            <td className="py-2.5">{p.clientName || "-"}</td>
                            <td className="py-2.5 font-medium">{formatCurrency(p.amount)}</td>
                            <td className="py-2.5">{formatDate(p.dueDate)}</td>
                            <td className="py-2.5">
                              <Badge className={`${sc?.bg} ${sc?.text} border-0 text-xs`}>
                                <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${sc?.dot}`} />
                                {PAYMENT_STATUS_LABELS[p.status]}
                              </Badge>
                            </td>
                            <td className="py-2.5">
                              {p.receiptUrl ? (
                                <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" /> Ver
                                </a>
                              ) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming & Overdue */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Upcoming */}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Proximos a Vencer (5 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!data?.upcoming || data.upcoming.length === 0) ? (
                  <p className="text-sm text-muted-foreground py-2">Sin pagos proximos</p>
                ) : (
                  <div className="space-y-2">
                    {data.upcoming.map((p) => (
                      <div key={p._id} className="flex items-center justify-between rounded-md bg-amber-50 p-2.5">
                        <div>
                          <p className="text-sm font-medium">
                            {p.caseRef ? (
                              <Link href={`/crm/cases/${p.caseRef._id}`} className="text-primary hover:underline">
                                {p.caseRef.caseCode}
                              </Link>
                            ) : "Caso"}
                            {" - "}{p.clientName || ""}
                          </p>
                          <p className="text-xs text-muted-foreground">Vence: {formatDate(p.dueDate)}</p>
                        </div>
                        <span className="font-semibold text-amber-700">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overdue */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!data?.overdue || data.overdue.length === 0) ? (
                  <p className="text-sm text-muted-foreground py-2">Sin pagos vencidos</p>
                ) : (
                  <div className="space-y-2">
                    {data.overdue.map((p) => (
                      <div key={p._id} className="flex items-center justify-between rounded-md bg-red-50 p-2.5">
                        <div>
                          <p className="text-sm font-medium">
                            {p.caseRef ? (
                              <Link href={`/crm/cases/${p.caseRef._id}`} className="text-primary hover:underline">
                                {p.caseRef.caseCode}
                              </Link>
                            ) : "Caso"}
                            {" - "}{p.clientName || ""}
                          </p>
                          <p className="text-xs text-muted-foreground">Vencio: {formatDate(p.dueDate)}</p>
                        </div>
                        <span className="font-semibold text-red-700">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Previsto vs Cobrado - Ultimos 12 Meses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="previsto" name="Previsto" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cobrado" name="Cobrado" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function buildChartData(historical: { amount: number; dueDate: string; status: string }[]) {
  const monthMap: Record<string, { previsto: number; cobrado: number }> = {};

  for (const p of historical) {
    if (!p.dueDate) continue;
    const d = new Date(p.dueDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap[key]) monthMap[key] = { previsto: 0, cobrado: 0 };
    monthMap[key].previsto += p.amount;
    if (p.status === "validado") {
      monthMap[key].cobrado += p.amount;
    }
  }

  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => {
      const [y, m] = key.split("-");
      return {
        month: `${MONTHS[parseInt(m) - 1]?.slice(0, 3)} ${y.slice(2)}`,
        ...vals,
      };
    });
}
