"use client";

// Tab de Contratación (RF-02): propuesta aprobada + pagos del caso + reloj de
// ejecución de 15 días hábiles (item 20).

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, CircleDollarSign, FileCheck2 } from "lucide-react";
import { usePusher } from "@/hooks/usePusher";
import {
  QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  QUOTE_CHANNEL_LABELS,
  type Quote, type Payment, type PaymentStatus,
} from "@/lib/types";
import { businessDaysBetween, executionProgressPercent } from "@/lib/dates/businessDays";

interface ContractTabProps {
  caseId: string;
  executionStartDate?: string;
  executionDeadline?: string;
}

function formatCurrency(amount?: number | null) {
  if (amount == null) return "-";
  return `$${Number(amount).toLocaleString("es-CO")}`;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function ContractTab({ caseId, executionStartDate, executionDeadline }: ContractTabProps) {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const load = useCallback(async () => {
    try {
      const [quotesRes, paymentsRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/quotes`),
        fetch(`/api/cases/${caseId}/payments`),
      ]);
      const quotesJson = await quotesRes.json();
      const paymentsJson = await paymentsRes.json();
      if (quotesJson.success) setQuotes(quotesJson.data);
      if (paymentsJson.success) setPayments(paymentsJson.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  usePusher(["payment:updated", "payment:receipt", "quote:approved"], load);

  if (loading) return <Skeleton className="h-64 w-full" />;

  const approvedQuote = quotes.find((q) => q.status === "aprobada");
  const approvedColor = approvedQuote ? QUOTE_STATUS_COLORS[approvedQuote.status] : null;

  const hasClock = Boolean(executionStartDate && executionDeadline);
  const progress = hasClock
    ? executionProgressPercent(new Date(executionStartDate!), new Date(executionDeadline!))
    : 0;
  const remainingDays = hasClock
    ? Math.max(0, businessDaysBetween(new Date(), new Date(executionDeadline!)))
    : 0;

  return (
    <div className="space-y-6">
      {/* Reloj de ejecución (15 días hábiles tras pago confirmado) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Ejecución (15 días hábiles)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasClock ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Inicio (pago confirmado)</p>
                  <p className="text-sm font-medium">{formatDate(executionStartDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vence</p>
                  <p className="text-sm font-medium">{formatDate(executionDeadline)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Días hábiles restantes</p>
                  <p className={`text-sm font-medium ${remainingDays <= 3 ? "text-destructive" : ""}`}>
                    {remainingDays}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={progress} className="flex-1" />
                <span className="text-sm font-medium w-12 text-right">{progress}%</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              El reloj de ejecución arranca automáticamente al validarse el primer pago del caso.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Propuesta aprobada (contrato comercial) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck2 className="h-4 w-4" />
            Propuesta contratada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedQuote ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${approvedColor?.bg} ${approvedColor?.text} border-0`}>
                  {QUOTE_STATUS_LABELS[approvedQuote.status]}
                </Badge>
                <span className="text-sm font-medium">Versión {approvedQuote.version}</span>
                {approvedQuote.channel && (
                  <span className="text-sm text-muted-foreground">
                    Enviada por {QUOTE_CHANNEL_LABELS[approvedQuote.channel]}
                  </span>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Valor final</p>
                  <p className="text-sm font-medium">{formatCurrency(approvedQuote.finalValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aprobada</p>
                  <p className="text-sm font-medium">{formatDate(approvedQuote.approvedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aprobada por</p>
                  <p className="text-sm font-medium">{approvedQuote.approvedBy?.displayName || "-"}</p>
                </div>
              </div>
              {approvedQuote.acceptanceNotes && (
                <p className="text-sm text-muted-foreground">
                  Motivo de aceptación: {approvedQuote.acceptanceNotes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no hay una propuesta aprobada para este caso.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4" />
            Pagos del caso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay pagos registrados (se crean con la cotización).
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => {
                const color = PAYMENT_STATUS_COLORS[p.status as PaymentStatus];
                return (
                  <div key={p._id} className="flex items-center justify-between gap-3 flex-wrap rounded-lg border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        Pago {p.paymentNumber} · {formatCurrency(p.amount)}
                        {p.percentage != null ? ` (${p.percentage}%)` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vence: {formatDate(p.dueDate)}
                        {p.paymentDate ? ` · Pagado: ${formatDate(p.paymentDate)}` : ""}
                      </p>
                    </div>
                    <Badge className={`${color?.bg} ${color?.text} border-0`}>
                      {PAYMENT_STATUS_LABELS[p.status as PaymentStatus] || p.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
